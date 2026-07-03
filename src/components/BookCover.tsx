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

/** Series/edition suffixes like "(The Final Empire, #1)" hurt exact-ish search matching. */
function searchTitle(title: string): string {
  return title.replace(/\s*\([^)]*\)\s*$/, "").trim() || title;
}

async function findOpenLibraryCover(title: string, author?: string | null): Promise<string | null> {
  const q = author ? `${title} ${author}` : title;
  const params = new URLSearchParams({ q, fields: "cover_i", limit: "1" });
  const res = await fetch(`https://openlibrary.org/search.json?${params.toString()}`);
  if (!res.ok) return null;
  const data = await res.json();
  const coverId = data?.docs?.[0]?.cover_i;
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
}

async function findGoogleBooksCover(title: string, author?: string | null): Promise<string | null> {
  const q = author ? `intitle:${title} inauthor:${author}` : `intitle:${title}`;
  const params = new URLSearchParams({ q, maxResults: "1" });
  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`);
  if (!res.ok) return null;
  const data = await res.json();
  const thumbnail = data?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
  // Google returns http:// links that 404 under https - the same path works fine upgraded.
  return thumbnail ? thumbnail.replace(/^http:/, "https:") : null;
}

type Stage = "isbn" | "ol-search" | "google-search" | "found" | "placeholder";

/** Falls back through: cover-by-ISBN -> Open Library search -> Google Books search -> placeholder. */
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
  const [stage, setStage] = useState<Stage>(isbn ? "isbn" : "ol-search");

  useEffect(() => {
    if (stage !== "ol-search" && stage !== "google-search") return;
    let cancelled = false;
    const cleanTitle = searchTitle(title);
    const finder = stage === "ol-search" ? findOpenLibraryCover : findGoogleBooksCover;

    finder(cleanTitle, author)
      .then((found) => {
        if (cancelled) return;
        if (found) {
          setSrc(found);
          setStage("found");
        } else {
          setStage(stage === "ol-search" ? "google-search" : "placeholder");
        }
      })
      .catch(() => {
        if (!cancelled) setStage(stage === "ol-search" ? "google-search" : "placeholder");
      });

    return () => {
      cancelled = true;
    };
  }, [stage, title, author]);

  function handleImageError() {
    if (stage === "isbn") setStage("ol-search");
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
