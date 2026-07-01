import Link from "next/link";
import { getFinishedEntries } from "@/lib/queries";
import { genreColor } from "@/lib/genre-colors";

export const dynamic = "force-dynamic";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const finished = await getFinishedEntries();

  const years = Array.from(
    new Set(finished.map((e) => e.endDate?.slice(0, 4)).filter((y): y is string => Boolean(y)))
  ).sort((a, b) => Number(b) - Number(a));

  const selectedYear = yearParam && years.includes(yearParam) ? yearParam : "all";
  const scoped = selectedYear === "all" ? finished : finished.filter((e) => e.endDate?.startsWith(selectedYear));

  const totalBooks = scoped.length;
  const totalPages = scoped.reduce((sum, e) => sum + (e.book.totalPages ?? 0), 0);

  const genreCounts = new Map<string, { count: number; pages: number }>();
  for (const e of scoped) {
    const genre = e.book.genre?.trim() || "Unspecified";
    const current = genreCounts.get(genre) ?? { count: 0, pages: 0 };
    current.count += 1;
    current.pages += e.book.totalPages ?? 0;
    genreCounts.set(genre, current);
  }
  const genreRows = Array.from(genreCounts.entries()).sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Stats</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/stats?year=all"
            className={`rounded-full px-3 py-1.5 text-sm ${
              selectedYear === "all"
                ? "bg-blue-600 text-white"
                : "bg-black/5 text-black/70 hover:bg-black/10 dark:bg-white/10 dark:text-white/70"
            }`}
          >
            All time
          </Link>
          {years.map((y) => (
            <Link
              key={y}
              href={`/stats?year=${y}`}
              className={`rounded-full px-3 py-1.5 text-sm ${
                selectedYear === y
                  ? "bg-blue-600 text-white"
                  : "bg-black/5 text-black/70 hover:bg-black/10 dark:bg-white/10 dark:text-white/70"
              }`}
            >
              {y}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-black/10 p-6 text-center dark:border-white/10">
          <p className="text-3xl font-semibold">{totalBooks}</p>
          <p className="text-sm text-black/60 dark:text-white/60">Books finished</p>
        </div>
        <div className="rounded-lg border border-black/10 p-6 text-center dark:border-white/10">
          <p className="text-3xl font-semibold">{totalPages.toLocaleString()}</p>
          <p className="text-sm text-black/60 dark:text-white/60">Total pages</p>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">By genre</h2>
        {genreRows.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">No finished books yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {genreRows.map(([genre, data]) => {
              const color = genreColor(genre);
              const widthPct = totalBooks ? (data.count / totalBooks) * 100 : 0;
              return (
                <div key={genre} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm">{genre}</span>
                  <div className="h-4 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${widthPct}%`, backgroundColor: color.dot }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-sm text-black/60 dark:text-white/60">
                    {data.count} book{data.count === 1 ? "" : "s"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
