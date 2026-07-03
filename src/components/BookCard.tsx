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

export function BookCard({ book }: { book: BookWithRelations }) {
  const entry = latestEntry(book.readEntries);

  return (
    <Link
      href={`/library/${book.id}`}
      className="group flex flex-col gap-3 rounded-lg border border-border p-3 transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg"
    >
      <div className="relative">
        <BookCover
          title={book.title}
          author={book.author}
          genre={book.genre}
          isbn={book.isbn}
          className="aspect-[2/3] w-full"
        />
        {entry && (
          <span className="absolute right-1.5 top-1.5">
            <StatusBadge status={entry.status} />
          </span>
        )}
      </div>
      <div>
        <h3 className="font-medium leading-tight">{book.title}</h3>
        <p className="text-sm text-muted">{book.author}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <GenreTag genre={book.genre} />
      </div>
      {entry?.status === "finished" && <StarRatingDisplay rating={entry.rating} />}
    </Link>
  );
}
