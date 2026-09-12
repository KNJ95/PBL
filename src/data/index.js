import { storage } from "../lib/storage";

// ─── 学生一覧 ──────────────────────────────────────────────────────────────
export const getStudents = () => storage.get("students_list") || [];

// ─── 旧フォーマット振り返り（survey:{uid}: キー） ─────────────────────────
export const getSurveys = (uid) =>
  storage.keys(`survey:${uid}:`).map(k => storage.get(k)).filter(Boolean)
    .sort((a, b) => b.timestamp - a.timestamp);

// ─── 活動ログ（log:{uid}: キー） ─────────────────────────────────────────
export const getLogs = (uid) =>
  storage.keys(`log:${uid}:`).map(k => storage.get(k)).filter(Boolean)
    .sort((a, b) => b.timestamp - a.timestamp);

// ─── メンター評価（mentor_survey:{studentId}: キー） ──────────────────────
export const getMentorSurveys = (sid) =>
  storage.keys(`mentor_survey:${sid}:`).map(k => storage.get(k)).filter(Boolean)
    .sort((a, b) => b.timestamp - a.timestamp);

// ─── 問い / フィードバック ────────────────────────────────────────────────
export const getQuestions  = () => storage.get("questions_store") || [];
export const getFeedbacks  = () => storage.get("feedbacks_store") || [];
export const saveQuestions = (d) => storage.set("questions_store", d);

// ─── 振り返り提出データ（pending_evals:{studentId} キー） ─────────────────

/**
 * 全学生の pending_evals を統合して返す（メンター用）
 * - 新形式: pending_evals:{studentId} を studentId をキーからで確定
 * - 旧形式: pending_evals（互換読み込み）
 */
export const getPending = () => {
  const perStudent = storage.keys("pending_evals:").flatMap(k => {
    const sid = k.slice("pending_evals:".length);
    const v = storage.get(k);
    return Array.isArray(v) ? v.map(e => ({ ...e, studentId: sid })) : [];
  });
  const legacy = storage.get("pending_evals");
  const all = [...perStudent, ...(Array.isArray(legacy) ? legacy : [])];
  const seen = new Set();
  return all.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
};

/**
 * pending_evals を保存する（studentId ごとに分割して保存）
 * リストから消えた studentId のキーは削除する
 */
export const savePending = (list) => {
  const grouped = {};
  list.forEach(p => {
    if (!p.studentId) return;
    if (!grouped[p.studentId]) grouped[p.studentId] = [];
    grouped[p.studentId].push(p);
  });
  // リストから消えた studentId のキーを削除
  storage.keys("pending_evals:").forEach(k => {
    const sid = k.slice("pending_evals:".length);
    if (!grouped[sid]) storage.del(k);
  });
  // 各 studentId のデータを保存
  Object.entries(grouped).forEach(([sid, entries]) => {
    storage.set(`pending_evals:${sid}`, entries);
  });
  // 旧形式 localStorage キーを削除（DynamoDB の旧エントリは自然消滅）
  try { localStorage.removeItem("pending_evals"); } catch {}
};
