import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { GenreTag } from "./GenreTag";
import { StarRatingDisplay } from "./StarRating";
import { BookCover } from "./BookCover";
import type { Book, ReadEntry } from "@/db/schema";

type BookWithRelations = Book & {
  readEntries: ReadEntry[];
};

function latestEntry(entries: ReadEntry[]): ReadEntry | undefined {
  const priority = { reading: 0, tbr: 1, finished: 2, dnf: 3 } as const;
  return [...entries].sort((a, b) => (priority[a.status] ?? 9) - (priority[b.status] ?? 9))[0];
}

export function BookRow({ book }: { book: BookWithRelations }) {
  const entry = latestEntry(book.readEntries);

  return (
    <Link
      href={`/library/${book.id}`}
      className="flex items-center gap-3 rounded-lg border border-border p-2 transition-colors hover:border-accent/50 hover:bg-surface"
    >
      <BookCover title={book.title} author={book.author} genre={book.genre} isbn={book.isbn} compact className="h-14 w-10 shrink-0" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium leading-tight">{book.title}</h3>
        <p className="truncate text-sm text-muted">{book.author}</p>
      </div>
      <GenreTag genre={book.genre} />
      {entry?.status === "finished" && <StarRatingDisplay rating={entry.rating} />}
      {entry && <StatusBadge status={entry.status} />}
    </Link>
  );
}
