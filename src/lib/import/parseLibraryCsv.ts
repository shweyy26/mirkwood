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

function detectHeaders(records: Row[]): string[] {
  return records.length ? Object.keys(records[0]) : [];
}

function parseGoodreads(records: Row[]): NormalizedBook[] {
  const books: NormalizedBook[] = [];

  for (const row of records) {
    const title = clean(row["Title"]);
    const author = clean(row["Author"]);
    if (!title || !author) continue;

    const isbn = stripGoodreadsFormula(row["ISBN13"]) ?? stripGoodreadsFormula(row["ISBN"]);
    const totalPages = parsePagesField(row["Number of Pages"]);
    const genre = firstNonStatusTag(clean(row["Bookshelves"]), ["read", "to-read", "currently-reading"]);

    const dateRead = normalizeDateToken(clean(row["Date Read"]) ?? "");
    const dateAdded = normalizeDateToken(clean(row["Date Added"]) ?? "");
    const rating = parseRatingField(row["My Rating"]);
    const notes = clean(row["My Review"]);
    const shelf = (clean(row["Exclusive Shelf"]) ?? "").toLowerCase();

    let status: ImportStatus = "tbr";
    if (dateRead) status = "finished";
    else if (shelf === "currently-reading") status = "reading";
    else if (shelf === "read") status = "finished";

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
          endDate: status === "finished" ? dateRead ?? dateAdded : null,
          rating: status === "finished" ? rating : null,
          notes: status === "finished" ? notes : null,
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
    const title = clean(row["Title"]);
    const author = clean(row["Authors"]);
    if (!title || !author) continue;

    const isbn = clean(row["ISBN/UID"]);
    const genre = firstNonStatusTag(clean(row["Tags"]), []);
    const rating = parseRatingField(row["Star Rating"]);
    const notes = clean(row["Review"]);
    const dateAdded = normalizeDateToken(clean(row["Date Added"]) ?? "");
    const readStatus = normalizeStoryGraphStatus(clean(row["Read Status"]));

    const periods = parseStoryGraphDatesRead(clean(row["Dates Read"]));

    const entries: NormalizedEntry[] =
      periods.length > 0
        ? periods.map((period, i) => ({
            status: period.end ? "finished" : "reading",
            isReread: i > 0,
            startDate: period.start,
            endDate: period.end,
            rating: i === periods.length - 1 && period.end ? rating : null,
            notes: i === periods.length - 1 && period.end ? notes : null,
          }))
        : [
            {
              status: readStatus,
              isReread: false,
              startDate: readStatus === "tbr" ? null : dateAdded,
              endDate: readStatus === "finished" ? dateAdded : null,
              rating: readStatus === "finished" ? rating : null,
              notes: readStatus === "finished" ? notes : null,
            },
          ];

    books.push({ title, author, isbn, totalPages: null, genre, entries });
  }

  return books;
}

export function parseLibraryCsv(text: string): { books: NormalizedBook[]; source: "goodreads" | "storygraph" } {
  const records = parse(text, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true }) as Row[];
  const headers = detectHeaders(records);

  if (headers.includes("Exclusive Shelf")) {
    return { books: parseGoodreads(records), source: "goodreads" };
  }
  if (headers.includes("Read Status")) {
    return { books: parseStoryGraph(records), source: "storygraph" };
  }
  throw new Error("Unrecognized CSV format — expected a Goodreads or StoryGraph library export.");
}
