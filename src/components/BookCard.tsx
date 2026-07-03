import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { GenreTag } from "./GenreTag";
import { StarRatingDisplay } from "./StarRating";
import { BookCover } from "./BookCover";
import { ConfirmButton } from "./ConfirmButton";
import { TrashIcon } from "./icons";
import { deleteBook } from "@/lib/actions/books";
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
    <div className="group relative flex flex-col gap-3 rounded-lg border border-border p-3 transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg">
      <Link href={`/library/${book.id}`} className="flex flex-col gap-3">
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

      <form action={deleteBook.bind(null, book.id)} className="absolute left-1.5 top-1.5">
        <ConfirmButton
          message={`Delete "${book.title}"? This can't be undone.`}
          ariaLabel={`Delete ${book.title}`}
          className="flex items-center justify-center rounded-full bg-black/50 p-1.5 text-white opacity-70 backdrop-blur-sm transition-opacity hover:bg-red-600 hover:opacity-100"
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </ConfirmButton>
      </form>
    </div>
  );
}
