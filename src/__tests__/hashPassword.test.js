// src/__tests__/hashPassword.test.js
//
// 【テスト対象】hashPassword 関数のユニットテスト
//
// ■ hashPassword(password: string) => Promise<string>
//   目的: Web Crypto API（crypto.subtle.digest）を使った SHA-256 ハッシュ化が
//         仕様どおりに動作することを確認する。
//   主な観点:
//     - 非同期関数であり Promise を返す
//     - 戻り値は 64 文字の小文字 16 進数文字列（SHA-256 の 32 バイト出力）
//     - 内部で crypto.subtle.digest を "SHA-256" アルゴリズムで呼び出す
//     - TextEncoder で文字列を Uint8Array にエンコードして渡す
//     - 各バイトは 2 桁の 16 進数にゼロパディングされる（例: 0x0f → "0f"）
//     - 空文字列でも例外を投げない
//
//   注意: jsdom 環境では crypto.subtle が未実装のため、
//         setupTests.js で 32 バイトの ArrayBuffer を返すモックに差し替えている。

import { hashPassword } from '../App';

describe('hashPassword', () => {
  it('Promise を返す（async 関数）', () => {
    const result = hashPassword('test');
    expect(result).toBeInstanceOf(Promise);
  });

  it('戻り値は長さ 64 の小文字 16 進数文字列', async () => {
    // setupTests.js のモック: crypto.subtle.digest → ArrayBuffer(32)（全バイト 0x00）
    // 32バイト × 2文字 = 64 文字の hex 文字列
    const hash = await hashPassword('somepassword');
    expect(typeof hash).toBe('string');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('crypto.subtle.digest を "SHA-256" アルゴリズムで呼び出す', async () => {
    await hashPassword('testinput');
    expect(global.crypto.subtle.digest).toHaveBeenCalledTimes(1);
    const call = global.crypto.subtle.digest.mock.calls[0];
    expect(call[0]).toBe('SHA-256');
  });

  it('TextEncoder で入力文字列をエンコードして digest に渡す', async () => {
    const password = 'hello世界';
    await hashPassword(password);
    const call = global.crypto.subtle.digest.mock.calls[0];
    expect(call[0]).toBe('SHA-256');
    // クロスレルム問題を避け、constructor.name で確認
    expect(call[1].constructor.name).toBe('Uint8Array');
    expect(call[1].length).toBeGreaterThan(0);
  });

  it('バイト 0x0f を含む場合は "0f" にゼロパディングされる', async () => {
    // モックを 0x0f 始まりのバッファに差し替え
    const buf = new Uint8Array(32);
    buf[0] = 0x0f;
    global.crypto.subtle.digest.mockResolvedValueOnce(buf.buffer);

    const hash = await hashPassword('padtest');
    expect(hash.startsWith('0f')).toBe(true);
  });

  it('全バイトが 0x00 の場合は "000...000"（64 文字の 0）になる', async () => {
    // setupTests.js のデフォルトモックは ArrayBuffer(32)（ゼロ埋め）
    const hash = await hashPassword('anything');
    expect(hash).toBe('0'.repeat(64));
  });

  it('空文字列でも例外を投げない', async () => {
    await expect(hashPassword('')).resolves.toHaveLength(64);
  });
});
