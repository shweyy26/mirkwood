"use client";

import { useEffect, useState } from "react";
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

function isbnCoverUrl(isbn: string): string {
  const digits = isbn.replace(/[^0-9Xx]/g, "");
  return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(digits)}-M.jpg?default=false`;
}

/** Falls back through: cover-by-ISBN -> title/author search -> colored placeholder. */
export function BookCover({
  title,
  author,
  genre,
  isbn,
  compact,
  className,
}: {
  title: string;
  author?: string | null;
  genre?: string | null;
  isbn?: string | null;
  compact?: boolean;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(isbn ? isbnCoverUrl(isbn) : null);
  const [stage, setStage] = useState<"isbn" | "searching" | "found" | "placeholder">(
    isbn ? "isbn" : "searching"
  );

  useEffect(() => {
    if (stage !== "searching") return;
    let cancelled = false;

    const params = new URLSearchParams({ title, fields: "cover_i", limit: "1" });
    if (author) params.set("author", author);

    fetch(`https://openlibrary.org/search.json?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const coverId = data?.docs?.[0]?.cover_i;
        if (coverId) {
          setSrc(`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`);
          setStage("found");
        } else {
          setStage("placeholder");
        }
      })
      .catch(() => {
        if (!cancelled) setStage("placeholder");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function handleImageError() {
    if (stage === "isbn") setStage("searching");
    else setStage("placeholder");
  }

  return (
    <div className={`relative overflow-hidden rounded-md bg-surface ${className ?? ""}`}>
      {src && stage !== "placeholder" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Cover of ${title}`}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          onError={handleImageError}
        />
      ) : (
        <Placeholder title={title} genre={genre} compact={compact} />
      )}
    </div>
  );
}
