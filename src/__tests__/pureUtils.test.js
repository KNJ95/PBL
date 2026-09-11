// src/__tests__/pureUtils.test.js
//
// 【テスト対象】ピュア関数のユニットテスト（レンダリングなし）
//
// ■ calcAxesFromAnswers
//   目的: survey_questions.json の回答（各設問への 1〜4 の値）を受け取り、
//         9 軸それぞれの Lv（1〜4）を計算して返すことを確認する。
//   主な観点:
//     - 空の回答 → 空オブジェクト
//     - 全回答 1 → 全軸 Lv 1
//     - 全回答 4 → 全軸 Lv 4
//     - axisWeights を使った重み付き平均の正確性
//     - 回答値 0 は計算に含まれない
//     - 出力値は常に 1〜4 の範囲に収まる
//
// ■ getDrillConfig
//   目的: 振り返りアンケートの主回答（1〜4）に応じた
//         深堀り設問（d1q/d1opts/d2q/d2opts）を返すことを確認する。
//   主な観点:
//     - 各値（1/2/3/4）でオブジェクト構造が正しい
//     - 選択肢の数が正確に 4 個
//     - mainValue=1 は「状況」を尋ねる文言
//     - mainValue=4 は「きっかけ」を尋ねる文言
//     - 範囲外の値（99 等）は Lv4 と同じ設定を返す
//
// ■ fmt / avg / axisAvg
//   目的: 日付フォーマット・平均計算・軸平均計算の補助関数を確認する。
//   主な観点:
//     - fmt: YYYY/MM/DD 形式・月日のゼロパディング
//     - avg: 空配列は 0・正しい平均値
//     - axisAvg: null/undefined は 0・値 0 の軸を除外した平均

import { calcAxesFromAnswers, getDrillConfig, fmt, avg, axisAvg } from '../App';
import surveyData from '../../public/survey_questions.json';

const allQuestions = surveyData.sections.flatMap((s) => s.questions);

// ─────────────────────────────────────────────────────────────────────────────
// calcAxesFromAnswers
// ─────────────────────────────────────────────────────────────────────────────
describe('calcAxesFromAnswers', () => {
  it('空の answers では空のオブジェクトを返す', () => {
    expect(calcAxesFromAnswers({}, allQuestions)).toEqual({});
  });

  it('全設問に回答値 0 を渡した場合は空のオブジェクトを返す（値 0 は無視）', () => {
    const answers = Object.fromEntries(allQuestions.map((q) => [q.id, 0]));
    expect(calcAxesFromAnswers(answers, allQuestions)).toEqual({});
  });

  it('全設問に回答値 1 を渡した場合、全軸が 1 になる', () => {
    const answers = Object.fromEntries(allQuestions.map((q) => [q.id, 1]));
    const result = calcAxesFromAnswers(answers, allQuestions);
    Object.values(result).forEach((lv) => {
      expect(lv).toBe(1);
    });
  });

  it('全設問に回答値 4 を渡した場合、全軸が 4 になる', () => {
    const answers = Object.fromEntries(allQuestions.map((q) => [q.id, 4]));
    const result = calcAxesFromAnswers(answers, allQuestions);
    Object.values(result).forEach((lv) => {
      expect(lv).toBe(4);
    });
  });

  it('出力値は常に 1〜4 の範囲に収まる', () => {
    const answers = Object.fromEntries(allQuestions.map((q) => [q.id, 2]));
    const result = calcAxesFromAnswers(answers, allQuestions);
    Object.values(result).forEach((lv) => {
      expect(lv).toBeGreaterThanOrEqual(1);
      expect(lv).toBeLessThanOrEqual(4);
    });
  });

  it('Q02（axisWeights: {8:0.9, 6:0.4, 1:0.4}）に回答 3 → axis8/6/1 がそれぞれ 3', () => {
    // ratio = (3×0.9)/(4×0.9) = 0.75 → round(0.75×4)=3
    const q02 = allQuestions.find((q) => q.id === 'Q02');
    const result = calcAxesFromAnswers({ Q02: 3 }, [q02]);
    expect(result['8']).toBe(3);
    expect(result['6']).toBe(3);
    expect(result['1']).toBe(3);
  });

  it('Q01（axisWeights: {1:0.9}）に回答 4 → axis1 が 4', () => {
    const q01 = allQuestions.find((q) => q.id === 'Q01');
    const result = calcAxesFromAnswers({ Q01: 4 }, [q01]);
    expect(result['1']).toBe(4);
  });

  it('Q01（axisWeights: {1:0.9}）に回答 1 → axis1 が 1', () => {
    const q01 = allQuestions.find((q) => q.id === 'Q01');
    const result = calcAxesFromAnswers({ Q01: 1 }, [q01]);
    expect(result['1']).toBe(1);
  });

  it('存在しない設問 ID は無視される', () => {
    const result = calcAxesFromAnswers({ NONEXISTENT: 3 }, allQuestions);
    // 存在しないキーへの回答は無視され、他の軸に影響しない
    expect(result).toEqual({});
  });

  it('一部の設問のみ回答した場合でもクラッシュしない', () => {
    const partial = { Q01: 3, Q05: 2 };
    expect(() => calcAxesFromAnswers(partial, allQuestions)).not.toThrow();
  });

  it('axisWeights が undefined の設問（questions に存在しない場合）は無視される', () => {
    const fakeQ = { id: 'fake', options: [] }; // axisWeights なし
    expect(() => calcAxesFromAnswers({ fake: 3 }, [fakeQ])).not.toThrow();
    expect(calcAxesFromAnswers({ fake: 3 }, [fakeQ])).toEqual({});
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getDrillConfig
// ─────────────────────────────────────────────────────────────────────────────
describe('getDrillConfig', () => {
  [1, 2, 3, 4].forEach((v) => {
    it(`mainValue=${v} で d1q/d1opts/d2q/d2opts を持つオブジェクトを返す`, () => {
      const cfg = getDrillConfig(v);
      expect(cfg).toHaveProperty('d1q');
      expect(cfg).toHaveProperty('d2q');
      expect(Array.isArray(cfg.d1opts)).toBe(true);
      expect(Array.isArray(cfg.d2opts)).toBe(true);
    });

    it(`mainValue=${v} で d1opts/d2opts の長さがそれぞれ 4`, () => {
      const cfg = getDrillConfig(v);
      expect(cfg.d1opts).toHaveLength(4);
      expect(cfg.d2opts).toHaveLength(4);
    });
  });

  it('mainValue=1 → d1q が「状況」を含む（どんな状況で…）', () => {
    expect(getDrillConfig(1).d1q).toContain('状況');
  });

  it('mainValue=2 → d1q が「どこまで」を含む', () => {
    expect(getDrillConfig(2).d1q).toContain('どこまで');
  });

  it('mainValue=3 → d1q が「どうやって」を含む', () => {
    expect(getDrillConfig(3).d1q).toContain('どうやって');
  });

  it('mainValue=4 → d1q が「きっかけ」を含む', () => {
    expect(getDrillConfig(4).d1q).toContain('きっかけ');
  });

  it('mainValue=99（4 以外の範囲外値）→ mainValue=4 と同じ結果になる', () => {
    expect(getDrillConfig(99)).toEqual(getDrillConfig(4));
  });

  it('各レベルの設問テキストはすべて文字列', () => {
    [1, 2, 3, 4].forEach((v) => {
      const cfg = getDrillConfig(v);
      expect(typeof cfg.d1q).toBe('string');
      expect(typeof cfg.d2q).toBe('string');
      cfg.d1opts.forEach((o) => expect(typeof o).toBe('string'));
      cfg.d2opts.forEach((o) => expect(typeof o).toBe('string'));
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// fmt（タイムスタンプ → YYYY/MM/DD）
// ─────────────────────────────────────────────────────────────────────────────
describe('fmt', () => {
  it('タイムスタンプを YYYY/MM/DD 形式に変換する', () => {
    // 2024-06-15 00:00:00 UTC+9 相当（JST で 2024/06/15）
    const ts = new Date('2024-06-15T00:00:00+09:00').getTime();
    const result = fmt(ts);
    expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
  });

  it('月と日を 2 桁にゼロパディングする', () => {
    // 2024-01-05 → "2024/01/05"
    const ts = new Date('2024-01-05T12:00:00').getTime();
    const result = fmt(ts);
    const [, month, day] = result.split('/');
    expect(month).toHaveLength(2);
    expect(day).toHaveLength(2);
  });

  it('年が正しく含まれる', () => {
    const ts = new Date('2025-11-20T09:00:00').getTime();
    expect(fmt(ts)).toContain('2025');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// avg（配列の平均）
// ─────────────────────────────────────────────────────────────────────────────
describe('avg', () => {
  it('空配列では 0 を返す', () => {
    expect(avg([])).toBe(0);
  });

  it('要素が 1 つの場合はその値を返す', () => {
    expect(avg([7])).toBe(7);
  });

  it('[1, 2, 3, 4] の平均は 2.5', () => {
    expect(avg([1, 2, 3, 4])).toBe(2.5);
  });

  it('[10, 20, 30] の平均は 20', () => {
    expect(avg([10, 20, 30])).toBe(20);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// axisAvg（9 軸のスコアオブジェクトの平均）
// ─────────────────────────────────────────────────────────────────────────────
describe('axisAvg', () => {
  it('null では 0 を返す', () => {
    expect(axisAvg(null)).toBe(0);
  });

  it('undefined では 0 を返す', () => {
    expect(axisAvg(undefined)).toBe(0);
  });

  it('全軸が 0 の場合は 0 を返す（スコア 0 は除外される）', () => {
    const scores = { 1: 0, 2: 0, 3: 0 };
    expect(axisAvg(scores)).toBe(0);
  });

  it('0 以外の軸のみを平均計算に使用する', () => {
    // axis1=4, axis2=0（除外）, axis3=2 → avg([4,2]) = 3
    const scores = { 1: 4, 2: 0, 3: 2 };
    expect(axisAvg(scores)).toBe(3);
  });

  it('全軸に有効なスコアがある場合は正しく平均を計算する', () => {
    const scores = { 1: 2, 2: 3, 3: 1, 4: 4, 5: 2, 6: 3, 7: 1, 8: 4, 9: 2 };
    // (2+3+1+4+2+3+1+4+2)/9 = 22/9 ≈ 2.44...
    const result = axisAvg(scores);
    expect(result).toBeCloseTo(22 / 9, 5);
  });
});
