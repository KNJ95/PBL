import { C } from "../constants/theme";

/**
 * ユーザーのイニシャルを表示するアバターコンポーネント
 */
export function Avatar({ name, size = 36, color = C.primary }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color + "22",
        border: `1.5px solid ${color}66`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        color,
        flexShrink: 0,
      }}
    >
      {name?.[0] ?? "?"}
    </div>
  );
}
