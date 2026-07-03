"use client";

import { useState } from "react";
import { genreColor } from "@/lib/genre-colors";

function Placeholder({
  title,
  genre,
  compact,
}: {
  title: string;
  genre: string | null | undefined;
  compact?: boolean;
}) {
  const color = genreColor(genre);
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center transition-transform group-hover:-rotate-1 group-hover:scale-[1.02]"
      style={{ backgroundColor: color.bg, color: color.fg }}
    >
      <span className={compact ? "text-lg" : "text-2xl"}>📖</span>
      {!compact && <span className="line-clamp-4 text-xs font-medium leading-snug">{title}</span>}
    </div>
  );
}

export function BookCover({
  title,
  genre,
  isbn,
  compact,
  className,
}: {
  title: string;
  genre?: string | null;
  isbn?: string | null;
  compact?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = isbn && !failed;

  return (
    <div className={`relative overflow-hidden rounded-md bg-surface ${className ?? ""}`}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-M.jpg?default=false`}
          alt={`Cover of ${title}`}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          onError={() => setFailed(true)}
        />
      ) : (
        <Placeholder title={title} genre={genre} compact={compact} />
      )}
    </div>
  );
}
