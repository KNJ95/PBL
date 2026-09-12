import { CLOUD_API } from "./storage";

/** パスワードを SHA-256 でハッシュ化（Web Crypto API） */
export const hashPassword = async (pw) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
};

/** DynamoDB からユーザープロファイルを取得 */
export const fetchUserProfile = async (userId) => {
  try {
    const r = await fetch(`${CLOUD_API}?userId=${encodeURIComponent(userId)}&dataKey=user_profile`);
    const json = await r.json();
    if (json.ok && json.data?.payload) return JSON.parse(json.data.payload);
  } catch {}
  return null;
};
