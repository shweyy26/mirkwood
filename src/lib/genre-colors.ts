// Fixed palette so colors stay stable across renders; genres are hashed to an index.
const PALETTE = [
  { bg: "#fee2e2", fg: "#991b1b", dot: "#ef4444" }, // red
  { bg: "#ffedd5", fg: "#9a3412", dot: "#f97316" }, // orange
  { bg: "#fef9c3", fg: "#854d0e", dot: "#eab308" }, // yellow
  { bg: "#dcfce7", fg: "#166534", dot: "#22c55e" }, // green
  { bg: "#ccfbf1", fg: "#115e59", dot: "#14b8a6" }, // teal
  { bg: "#dbeafe", fg: "#1e40af", dot: "#3b82f6" }, // blue
  { bg: "#e0e7ff", fg: "#3730a3", dot: "#6366f1" }, // indigo
  { bg: "#f3e8ff", fg: "#6b21a8", dot: "#a855f7" }, // purple
  { bg: "#fce7f3", fg: "#9d174d", dot: "#ec4899" }, // pink
  { bg: "#e7e5e4", fg: "#44403c", dot: "#78716c" }, // stone
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function genreColor(genre: string | null | undefined) {
  const key = genre?.trim() || "Unspecified";
  const index = hashString(key.toLowerCase()) % PALETTE.length;
  return PALETTE[index];
}
