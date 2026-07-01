import { genreColor } from "@/lib/genre-colors";

export function GenreTag({ genre }: { genre: string | null | undefined }) {
  if (!genre) return null;
  const color = genreColor(genre);
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: color.bg, color: color.fg }}
    >
      {genre}
    </span>
  );
}
