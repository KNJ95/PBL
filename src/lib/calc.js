import { AXES } from "../constants/axes";

/** タイムスタンプを YYYY/MM/DD 形式にフォーマット */
export const fmt = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
};

/** 配列の平均値 */
export const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

/** 9軸スコアオブジェクトの平均（0の軸は除外） */
export const axisAvg = (scores) => {
  if (!scores) return 0;
  const v = AXES.map(a => scores[a.id] || 0).filter(x => x > 0);
  return v.length ? avg(v) : 0;
};

/**
 * survey_questions.json の回答（answers）から9軸スコアを計算
 * @param {Object} answers   - { [questionId]: value(1-4) }
 * @param {Array}  allQuestions - surveyDef.sections.flatMap(s => s.questions)
 * @returns {Object} axes    - { [axisId: string]: score(1-4) }
 */
export function calcAxesFromAnswers(answers, allQuestions) {
  const raw = {}, maxs = {};
  allQuestions.forEach(q => {
    const val = answers[q.id];
    if (!val || val === 0) return; // 0（該当なし）・未回答はスキップ
    Object.entries(q.axisWeights || {}).forEach(([axId, w]) => {
      raw[axId]  = (raw[axId]  || 0) + val * w;
      maxs[axId] = (maxs[axId] || 0) + 4  * w;
    });
  });
  const axes = {};
  Object.keys(raw).forEach(axId => {
    if (maxs[axId] > 0) {
      const ratio = raw[axId] / maxs[axId];
      axes[String(axId)] = Math.max(1, Math.min(4, Math.round(ratio * 4)));
    }
  });
  return axes;
}
