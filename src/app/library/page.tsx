import Link from "next/link";
import { getAllBooksWithEntries } from "@/lib/queries";
import { BookCard } from "@/components/BookCard";
import type { ReadEntry } from "@/db/schema";

export const dynamic = "force-dynamic";

const TABS = [
  { value: "all", label: "All" },
  { value: "tbr", label: "TBR" },
  { value: "reading", label: "Reading" },
  { value: "finished", label: "Finished" },
  { value: "dnf", label: "DNF" },
] as const;

function latestStatus(entries: ReadEntry[]): string {
  const priority = { reading: 0, tbr: 1, finished: 2, dnf: 3 } as const;
  const sorted = [...entries].sort((a, b) => (priority[a.status] ?? 9) - (priority[b.status] ?? 9));
  return sorted[0]?.status ?? "tbr";
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status = "all", q = "" } = await searchParams;
  const books = await getAllBooksWithEntries();

  const filtered = books.filter((book) => {
    const matchesStatus = status === "all" || latestStatus(book.readEntries) === status;
    const query = q.trim().toLowerCase();
    const matchesQuery =
      !query || book.title.toLowerCase().includes(query) || book.author.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Library</h1>
        <div className="flex gap-2">
          <Link
            href="/library/import"
            className="rounded-md border border-black/15 px-3 py-2 text-sm font-medium dark:border-white/20"
          >
            Import CSV
          </Link>
          <Link href="/library/new" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500">
            + Add book
          </Link>
        </div>
      </div>

      <form className="flex flex-wrap items-center gap-3" method="get">
        <input type="hidden" name="status" value={status} />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search title or author…"
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        />
        <button type="submit" className="rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20">
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/library?status=${tab.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-full px-3 py-1.5 text-sm ${
              status === tab.value
                ? "bg-blue-600 text-white"
                : "bg-black/5 text-black/70 hover:bg-black/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">No books match this filter yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
