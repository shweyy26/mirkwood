import { parse } from "csv-parse/sync";

export type ImportStatus = "tbr" | "reading" | "finished" | "dnf";

export interface NormalizedEntry {
  status: ImportStatus;
  isReread: boolean;
  startDate: string | null;
  endDate: string | null;
  rating: number | null;
  notes: string | null;
}

export interface NormalizedBook {
  title: string;
  author: string;
  isbn: string | null;
  totalPages: number | null;
  genre: string | null;
  entries: NormalizedEntry[];
}

type Row = Record<string, string>;

function clean(value: string | undefined | null): string | null {
  const v = value?.trim();
  return v ? v : null;
}

/** Headers can carry a BOM, stray casing, or trailing whitespace depending on how the file was saved/re-saved. */
function normalizeHeaderKey(key: string): string {
  return key.replace(/^﻿/, "").trim().toLowerCase();
}

function getField(row: Row, name: string): string | undefined {
  const wanted = normalizeHeaderKey(name);
  for (const key of Object.keys(row)) {
    if (normalizeHeaderKey(key) === wanted) return row[key];
  }
  return undefined;
}

function hasHeader(records: Row[], name: string): boolean {
  if (!records.length) return false;
  const wanted = normalizeHeaderKey(name);
  return Object.keys(records[0]).some((k) => normalizeHeaderKey(k) === wanted);
}

function normalizeDateToken(token: string): string | null {
  const parts = token.split(/[\/-]/).map((p) => p.trim());
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  if (!/^\d{4}$/.test(y)) return null;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function stripGoodreadsFormula(value: string | undefined | null): string | null {
  const v = clean(value);
  if (!v) return null;
  return v.replace(/^="?/, "").replace(/"$/, "").trim() || null;
}

function firstNonStatusTag(raw: string | null, statusWords: string[]): string | null {
  if (!raw) return null;
  const tags = raw.split(",").map((t) => t.trim()).filter(Boolean);
  const normalizedStatus = statusWords.map((s) => s.toLowerCase());
  const genre = tags.find((t) => !normalizedStatus.includes(t.toLowerCase()));
  return genre ?? null;
}

function parsePagesField(value: string | undefined | null): number | null {
  const v = clean(value);
  if (!v) return null;
  const n = Number(v.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function parseRatingField(value: string | undefined | null): number | null {
  const v = clean(value);
  if (!v) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(5, Math.max(1, Math.round(n)));
}

/** The shelf/status column is the source of truth; a missing or unrecognized shelf name falls back to "tbr" rather than guessing from dates. */
function normalizeGoodreadsShelf(raw: string | null): ImportStatus {
  const shelf = (raw ?? "").toLowerCase().trim();
  if (shelf === "currently-reading") return "reading";
  if (shelf === "did-not-finish" || shelf === "dnf") return "dnf";
  if (shelf === "read") return "finished";
  return "tbr";
}

function parseGoodreads(records: Row[]): NormalizedBook[] {
  const books: NormalizedBook[] = [];

  for (const row of records) {
    const title = clean(getField(row, "Title"));
    const author = clean(getField(row, "Author"));
    if (!title || !author) continue;

    const isbn = stripGoodreadsFormula(getField(row, "ISBN13")) ?? stripGoodreadsFormula(getField(row, "ISBN"));
    const totalPages = parsePagesField(getField(row, "Number of Pages"));
    const genre = firstNonStatusTag(clean(getField(row, "Bookshelves")), ["read", "to-read", "currently-reading", "did-not-finish"]);

    const dateRead = normalizeDateToken(clean(getField(row, "Date Read")) ?? "");
    const dateAdded = normalizeDateToken(clean(getField(row, "Date Added")) ?? "");
    const rating = parseRatingField(getField(row, "My Rating"));
    const notes = clean(getField(row, "My Review"));
    const status = normalizeGoodreadsShelf(clean(getField(row, "Exclusive Shelf")));

    const isDone = status === "finished" || status === "dnf";

    books.push({
      title,
      author,
      isbn,
      totalPages,
      genre,
      entries: [
        {
          status,
          isReread: false,
          startDate: status === "tbr" ? null : dateRead ?? dateAdded,
          endDate: isDone ? dateRead ?? dateAdded : null,
          rating: status === "finished" ? rating : null,
          notes: isDone ? notes : null,
        },
      ],
    });
  }

  return books;
}

function parseStoryGraphDatesRead(raw: string | null): { start: string | null; end: string | null }[] {
  if (!raw) return [];
  const dateToken = /\d{4}[\/-]\d{1,2}[\/-]\d{1,2}/g;
  return raw
    .split(",")
    .map((segment) => {
      const tokens = segment.match(dateToken);
      if (!tokens || tokens.length === 0) return null;
      return {
        start: normalizeDateToken(tokens[0]),
        end: tokens[1] ? normalizeDateToken(tokens[1]) : null,
      };
    })
    .filter((v): v is { start: string | null; end: string | null } => v !== null);
}

function normalizeStoryGraphStatus(raw: string | null): ImportStatus {
  const s = (raw ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (s.includes("currentlyreading")) return "reading";
  if (s.includes("didnotfinish") || s === "dnf") return "dnf";
  if (s.includes("toread") || s.includes("wanttoread")) return "tbr";
  if (s.includes("read")) return "finished";
  return "tbr";
}

function parseStoryGraph(records: Row[]): NormalizedBook[] {
  const books: NormalizedBook[] = [];

  for (const row of records) {
    const title = clean(getField(row, "Title"));
    const author = clean(getField(row, "Authors"));
    if (!title || !author) continue;

    const isbn = clean(getField(row, "ISBN/UID"));
    const genre = firstNonStatusTag(clean(getField(row, "Tags")), []);
    const rating = parseRatingField(getField(row, "Star Rating"));
    const notes = clean(getField(row, "Review"));
    const dateAdded = normalizeDateToken(clean(getField(row, "Date Added")) ?? "");
    const lastDateRead = normalizeDateToken(clean(getField(row, "Last Date Read")) ?? "");
    const status = normalizeStoryGraphStatus(clean(getField(row, "Read Status")));

    const periods = parseStoryGraphDatesRead(clean(getField(row, "Dates Read")));

    let entries: NormalizedEntry[];

    if (status === "finished" && periods.length > 0) {
      // Multiple comma-separated periods = past re-reads; only the most recent gets the rating/review.
      entries = periods.map((period, i) => ({
        status: "finished",
        isReread: i > 0,
        startDate: period.start,
        endDate: period.end ?? period.start,
        rating: i === periods.length - 1 ? rating : null,
        notes: i === periods.length - 1 ? notes : null,
      }));
    } else if (status === "finished") {
      const finishDate = lastDateRead ?? dateAdded;
      entries = [{ status: "finished", isReread: false, startDate: finishDate, endDate: finishDate, rating, notes }];
    } else if (status === "reading") {
      entries = [{ status: "reading", isReread: false, startDate: periods[0]?.start ?? dateAdded, endDate: null, rating: null, notes: null }];
    } else if (status === "dnf") {
      const stopDate = periods[0]?.end ?? lastDateRead ?? dateAdded;
      entries = [{ status: "dnf", isReread: false, startDate: periods[0]?.start ?? dateAdded, endDate: stopDate, rating: null, notes }];
    } else {
      entries = [{ status: "tbr", isReread: false, startDate: null, endDate: null, rating: null, notes: null }];
    }

    books.push({ title, author, isbn, totalPages: null, genre, entries });
  }

  return books;
}

export function parseLibraryCsv(text: string): { books: NormalizedBook[]; source: "goodreads" | "storygraph" } {
  const records = parse(text, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true }) as Row[];

  if (hasHeader(records, "Exclusive Shelf")) {
    return { books: parseGoodreads(records), source: "goodreads" };
  }
  if (hasHeader(records, "Read Status")) {
    return { books: parseStoryGraph(records), source: "storygraph" };
  }
  throw new Error("Unrecognized CSV format — expected a Goodreads or StoryGraph library export.");
}
