import Link from "next/link";
import { getAllBooksWithEntries } from "@/lib/queries";
import { BookCard } from "@/components/BookCard";
import { BookRow } from "@/components/BookRow";
import type { Book, ReadEntry } from "@/db/schema";

export const dynamic = "force-dynamic";

const TABS = [
  { value: "all", label: "All" },
  { value: "tbr", label: "TBR" },
  { value: "reading", label: "Reading" },
  { value: "finished", label: "Finished" },
  { value: "dnf", label: "DNF" },
] as const;

const SORTS = [
  { value: "recent", label: "Recently added" },
  { value: "title", label: "Title A–Z" },
  { value: "author", label: "Author A–Z" },
  { value: "rating", label: "Highest rated" },
] as const;

function latestEntry(entries: ReadEntry[]): ReadEntry | undefined {
  const priority = { reading: 0, tbr: 1, finished: 2, dnf: 3 } as const;
  return [...entries].sort((a, b) => (priority[a.status] ?? 9) - (priority[b.status] ?? 9))[0];
}

function latestStatus(entries: ReadEntry[]): string {
  return latestEntry(entries)?.status ?? "tbr";
}

function sortBooks<T extends Book & { readEntries: ReadEntry[] }>(books: T[], sort: string): T[] {
  const arr = [...books];
  switch (sort) {
    case "title":
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case "author":
      return arr.sort((a, b) => a.author.localeCompare(b.author));
    case "rating":
      return arr.sort((a, b) => (latestEntry(b.readEntries)?.rating ?? -1) - (latestEntry(a.readEntries)?.rating ?? -1));
    default:
      return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; sort?: string; view?: string }>;
}) {
  const { status = "all", q = "", sort = "recent", view = "grid" } = await searchParams;
  const books = await getAllBooksWithEntries();

  const statuses = books.map((book) => latestStatus(book.readEntries));
  const counts = {
    all: books.length,
    tbr: statuses.filter((s) => s === "tbr").length,
    reading: statuses.filter((s) => s === "reading").length,
    finished: statuses.filter((s) => s === "finished").length,
    dnf: statuses.filter((s) => s === "dnf").length,
  };

  const filtered = sortBooks(
    books.filter((book) => {
      const matchesStatus = status === "all" || latestStatus(book.readEntries) === status;
      const query = q.trim().toLowerCase();
      const matchesQuery =
        !query || book.title.toLowerCase().includes(query) || book.author.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    }),
    sort
  );

  const defaults: Record<string, string> = { status: "all", q: "", sort: "recent", view: "grid" };
  const current: Record<string, string> = { status, q, sort, view };

  function withParam(key: string, value: string) {
    const merged = { ...current, [key]: value };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== defaults[k]) params.set(k, v);
    }
    return `/library?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold">Library</h1>
        <div className="flex gap-2">
          <Link
            href="/library/import"
            className="rounded-md border border-border px-3 py-2 text-sm font-medium "
          >
            Import CSV
          </Link>
          <Link href="/library/new" className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover">
            + Add book
          </Link>
        </div>
      </div>

      <form className="flex flex-wrap items-center gap-3" method="get">
        <input type="hidden" name="status" value={status} />
        <input type="hidden" name="view" value={view} />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search title or author…"
          className="rounded-md border border-border bg-transparent px-3 py-2 text-sm "
        />
        <select
          name="sort"
          defaultValue={sort}
          className="rounded-md border border-border bg-transparent px-3 py-2 text-sm "
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md border border-border px-3 py-2 text-sm ">
          Apply
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <Link
              key={tab.value}
              href={withParam("status", tab.value)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                status === tab.value
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {tab.label} <span className="opacity-70">({counts[tab.value]})</span>
            </Link>
          ))}
        </div>

        <div className="flex gap-1 rounded-md border border-border p-1 text-sm">
          <Link
            href={withParam("view", "grid")}
            className={`rounded px-2 py-1 ${view === "grid" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"}`}
          >
            Grid
          </Link>
          <Link
            href={withParam("view", "list")}
            className={`rounded px-2 py-1 ${view === "list" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"}`}
          >
            List
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted ">No books match this filter yet.</p>
      ) : view === "list" ? (
        <div className="flex flex-col gap-2">
          {filtered.map((book) => (
            <BookRow key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
