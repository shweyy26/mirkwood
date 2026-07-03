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

export function BookRow({ book }: { book: BookWithRelations }) {
  const entry = latestEntry(book.readEntries);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-2 transition-colors hover:border-accent/50 hover:bg-surface">
      <Link href={`/library/${book.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <BookCover title={book.title} author={book.author} genre={book.genre} isbn={book.isbn} compact className="h-14 w-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium leading-tight">{book.title}</h3>
          <p className="truncate text-sm text-muted">{book.author}</p>
        </div>
        <GenreTag genre={book.genre} />
        {entry?.status === "finished" && <StarRatingDisplay rating={entry.rating} />}
        {entry && <StatusBadge status={entry.status} />}
      </Link>
      <form action={deleteBook.bind(null, book.id)}>
        <ConfirmButton
          message={`Delete "${book.title}"? This can't be undone.`}
          ariaLabel={`Delete ${book.title}`}
          className="flex items-center justify-center rounded-full p-2 text-muted hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950 dark:hover:text-red-300"
        >
          <TrashIcon className="h-4 w-4" />
        </ConfirmButton>
      </form>
    </div>
  );
}
