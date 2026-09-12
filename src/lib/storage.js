// ─── ストレージ（localStorage + DynamoDB 二重書き） ───────────────────────
export const CLOUD_API = "https://lov5ejwmxbqzci5gagmcrzr3ia0qphjl.lambda-url.ap-northeast-1.on.aws";

let _cloudUid = null;

export const storage = {
  get: (k) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; }
  },

  set: (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
    if (_cloudUid) {
      fetch(CLOUD_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: _cloudUid, dataKey: k, payload: JSON.stringify(v) }),
      }).catch(() => {});
    }
  },

  del: (k) => {
    try { localStorage.removeItem(k); } catch {}
    if (_cloudUid) {
      fetch(`${CLOUD_API}?userId=${encodeURIComponent(_cloudUid)}&dataKey=${encodeURIComponent(k)}`, {
        method: "DELETE",
      }).catch(() => {});
    }
  },

  /** localStorage のキーをプレフィックスで前方一致検索 */
  keys: (prefix) => {
    const result = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) result.push(k);
      }
    } catch {}
    return result;
  },

  /** 現在セッションのクラウドユーザーを設定（DynamoDB 書き込みに使用） */
  setUser: (uid) => { _cloudUid = uid; },

  /** ログアウト時にクラウドユーザーをリセット */
  clearUser: () => { _cloudUid = null; },

  /**
   * DynamoDB からユーザーのデータを取得して localStorage にマージ
   * @param {string} uid - 取得対象のユーザーID
   * @param {Set<string>} skipKeys - 上書きしないキーのセット（current_user 等を保護）
   */
  syncFromCloud: async (uid, skipKeys = new Set()) => {
    try {
      const r = await fetch(`${CLOUD_API}?userId=${encodeURIComponent(uid)}`);
      const json = await r.json();
      if (json.ok && Array.isArray(json.data)) {
        json.data.forEach(item => {
          try {
            if (!item.payload || skipKeys.has(item.dataKey)) return;

            // pending_evals:* はマージ（上書きではなく、既存と結合して重複排除）
            if (item.dataKey.startsWith("pending_evals:")) {
              const existing = (() => {
                try { const v = localStorage.getItem(item.dataKey); return v ? JSON.parse(v) : []; }
                catch { return []; }
              })();
              const incoming = (() => {
                try { return JSON.parse(item.payload); }
                catch { return []; }
              })();

              if (Array.isArray(existing) && Array.isArray(incoming)) {
                const merged = [...existing];
                incoming.forEach(e => {
                  if (e.id && !merged.find(x => x.id === e.id)) merged.push(e);
                });
                localStorage.setItem(item.dataKey, JSON.stringify(merged));
              } else if (Array.isArray(existing) && existing.length > 0) {
                // incoming が配列でない（null・不正データ）場合は既存データを保護して上書きしない
              } else {
                localStorage.setItem(item.dataKey, item.payload);
              }
            } else {
              localStorage.setItem(item.dataKey, item.payload);
            }
          } catch {}
        });
      }
    } catch {}
  },
};
