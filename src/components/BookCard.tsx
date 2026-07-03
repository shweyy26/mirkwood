import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { GenreTag } from "./GenreTag";
import { StarRatingDisplay } from "./StarRating";
import type { Book, ReadEntry, Series } from "@/db/schema";

type BookWithRelations = Book & {
  readEntries: ReadEntry[];
  series: Series | null;
};

function latestEntry(entries: ReadEntry[]): ReadEntry | undefined {
  const priority = { reading: 0, tbr: 1, finished: 2, dnf: 3 } as const;
  return [...entries].sort((a, b) => (priority[a.status] ?? 9) - (priority[b.status] ?? 9))[0];
}

export function BookCard({ book }: { book: BookWithRelations }) {
  const entry = latestEntry(book.readEntries);

  return (
    <Link
      href={`/library/${book.id}`}
      className="flex flex-col gap-2 rounded-lg border border-border p-4 transition hover:border-accent/50  "
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-medium leading-tight">{book.title}</h3>
          <p className="text-sm text-muted ">{book.author}</p>
        </div>
        {entry && <StatusBadge status={entry.status} />}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <GenreTag genre={book.genre} />
        {book.series && (
          <span className="text-xs text-muted ">
            {book.series.name}
            {book.seriesIndex != null ? ` #${book.seriesIndex}` : ""}
          </span>
        )}
      </div>
      {entry?.status === "finished" && <StarRatingDisplay rating={entry.rating} />}
    </Link>
  );
}
