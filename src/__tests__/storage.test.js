// src/__tests__/storage.test.js
//
// 【テスト対象】storage オブジェクトのユニットテスト
//
// ■ storage（localStorage + AWS Lambda 二重書き抽象化レイヤー）
//   目的: アプリ全体のデータ永続化を担う storage オブジェクトが、
//         ローカル保存・クラウド同期の両方において仕様どおりに動作することを確認する。
//
//   主な観点（get / set）:
//     - JSON シリアライズ可能な値（オブジェクト・配列・数値）を保存・取得できる
//     - 存在しないキーは null を返す
//     - setUser を呼ぶ前（cloudUid=null）は fetch を呼ばない
//     - setUser 後の set は Lambda URL に POST を送る（fetch モックで検証）
//     - POST ボディに userId と dataKey が含まれる
//
//   主な観点（del）:
//     - localStorage からキーを削除する
//     - setUser 後の del は Lambda URL に DELETE を送る
//
//   主な観点（keys）:
//     - 指定プレフィックスに一致するキーの一覧を返す
//     - 不一致のキーは含まれない
//
//   主な観点（syncFromCloud）:
//     - クラウドから取得したデータを localStorage に書き込む
//     - skipKeys に指定したキーは上書きしない
//     - pending_evals: キーはマージ方式（重複 ID を排除して結合）
//     - ok=false レスポンスやネットワークエラーで例外を投げない
//
//   注意: _cloudUid はモジュールレベルの状態のため、
//         テスト後に必ず storage.clearUser() を呼んでリセットする。

import { storage } from '../App';

// _cloudUid はモジュールレベルのプライベート状態のため、
// テスト後に必ず clearUser() を呼んでリセットする
afterEach(() => {
  storage.clearUser();
});

// ─────────────────────────────────────────────────────────────────────────────
// get / set
// ─────────────────────────────────────────────────────────────────────────────
describe('storage.get / storage.set', () => {
  it('JSON シリアライズ可能な値を localStorage に保存・取得できる', () => {
    storage.set('testKey', { name: 'Alice', score: 42 });
    expect(storage.get('testKey')).toEqual({ name: 'Alice', score: 42 });
  });

  it('存在しないキーでは null を返す', () => {
    expect(storage.get('nonexistent')).toBeNull();
  });

  it('配列を保存・取得できる', () => {
    storage.set('arr', [1, 2, 3]);
    expect(storage.get('arr')).toEqual([1, 2, 3]);
  });

  it('数値を保存・取得できる', () => {
    storage.set('num', 999);
    expect(storage.get('num')).toBe(999);
  });

  it('clearUser 後は set しても fetch を呼ばない', () => {
    storage.clearUser();
    storage.set('k', 'v');
    // fetch はモジュールレベルの fetch mock
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('setUser 後の set は POST fetch を呼ぶ', () => {
    storage.setUser('uid-001');
    storage.set('someKey', { x: 1 });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('lambda-url'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('POST body に userId と dataKey が含まれる', () => {
    storage.setUser('user-xyz');
    storage.set('mydata', [42]);
    const call = global.fetch.mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.userId).toBe('user-xyz');
    expect(body.dataKey).toBe('mydata');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// del
// ─────────────────────────────────────────────────────────────────────────────
describe('storage.del', () => {
  it('localStorage からキーを削除する', () => {
    storage.set('delme', 'value');
    storage.del('delme');
    expect(storage.get('delme')).toBeNull();
  });

  it('clearUser 後は del しても fetch を呼ばない', () => {
    storage.clearUser();
    storage.set('k', 'v');
    jest.clearAllMocks();
    storage.del('k');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('setUser 後の del は DELETE fetch を呼ぶ', () => {
    storage.setUser('uid-del');
    storage.set('deleteKey', 'something');
    jest.clearAllMocks();
    storage.del('deleteKey');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('deleteKey'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// keys
// ─────────────────────────────────────────────────────────────────────────────
describe('storage.keys', () => {
  it('プレフィックスに一致するキー一覧を返す', () => {
    storage.set('survey:u1:ts1', { a: 1 });
    storage.set('survey:u1:ts2', { b: 2 });
    storage.set('log:u1:ts1', { c: 3 });

    const keys = storage.keys('survey:u1:');
    expect(keys).toHaveLength(2);
    expect(keys).toContain('survey:u1:ts1');
    expect(keys).toContain('survey:u1:ts2');
  });

  it('一致するキーがない場合は空配列を返す', () => {
    expect(storage.keys('prefix:does:not:exist:')).toEqual([]);
  });

  it('別のプレフィックスのキーは含まれない', () => {
    storage.set('type1:key', 1);
    storage.set('type2:key', 2);
    const keys = storage.keys('type1:');
    expect(keys).not.toContain('type2:key');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// syncFromCloud
// ─────────────────────────────────────────────────────────────────────────────
describe('storage.syncFromCloud', () => {
  it('クラウドのデータを localStorage に書き込む', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        data: [
          { dataKey: 'cloud_key', payload: JSON.stringify({ cloud: true }) },
        ],
      }),
    });

    await storage.syncFromCloud('uid-sync');
    expect(storage.get('cloud_key')).toEqual({ cloud: true });
  });

  it('skipKeys に含まれるキーはスキップされる', async () => {
    storage.set('protected', { original: true });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        data: [
          { dataKey: 'protected', payload: JSON.stringify({ overwritten: true }) },
        ],
      }),
    });

    await storage.syncFromCloud('uid-skip', new Set(['protected']));
    // 上書きされていないはず
    expect(storage.get('protected')).toEqual({ original: true });
  });

  it('pending_evals: キーはマージ（重複排除）される', async () => {
    // 既存データ
    localStorage.setItem(
      'pending_evals:stu1',
      JSON.stringify([{ id: 'eval-1', data: 'a' }])
    );

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        data: [
          {
            dataKey: 'pending_evals:stu1',
            payload: JSON.stringify([
              { id: 'eval-1', data: 'a' }, // 重複
              { id: 'eval-2', data: 'b' }, // 新規
            ]),
          },
        ],
      }),
    });

    await storage.syncFromCloud('uid-merge');
    const merged = storage.get('pending_evals:stu1');
    expect(merged).toHaveLength(2);
    expect(merged.map((e) => e.id)).toContain('eval-1');
    expect(merged.map((e) => e.id)).toContain('eval-2');
  });

  it('ok=false のレスポンスでも例外を投げない', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: false }),
    });

    await expect(storage.syncFromCloud('uid-fail')).resolves.not.toThrow();
  });

  it('ネットワークエラーでも例外を投げない', async () => {
    global.fetch.mockRejectedValueOnce(new Error('network error'));

    await expect(storage.syncFromCloud('uid-neterr')).resolves.not.toThrow();
  });
});
