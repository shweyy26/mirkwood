import Link from "next/link";
import { getAllSeriesWithBooks } from "@/lib/queries";
import { createSeries, deleteSeries } from "@/lib/actions/series";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { ConfirmButton } from "@/components/ConfirmButton";
import type { ReadEntry } from "@/db/schema";

export const dynamic = "force-dynamic";

function latestStatus(entries: ReadEntry[]): string {
  const priority = { reading: 0, tbr: 1, finished: 2, dnf: 3 } as const;
  const sorted = [...entries].sort((a, b) => (priority[a.status] ?? 9) - (priority[b.status] ?? 9));
  return sorted[0]?.status ?? "tbr";
}

export default async function SeriesPage() {
  const allSeries = await getAllSeriesWithBooks();

  async function createSeriesAction(formData: FormData) {
    "use server";
    await createSeries(formData);
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Series</h1>

      <form action={createSeriesAction} className="flex items-center gap-2">
        <input
          name="name"
          required
          placeholder="New series name"
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        />
        <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500">
          + Add series
        </button>
      </form>

      {allSeries.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">
          No series yet. Add one above, then assign books to it from the book edit form.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {allSeries.map((s) => {
            const finishedCount = s.books.filter((b) => latestStatus(b.readEntries) === "finished").length;
            const total = s.books.length;
            return (
              <div key={s.id} className="rounded-lg border border-black/10 p-4 dark:border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-medium">{s.name}</h2>
                  <span className="text-sm text-black/60 dark:text-white/60">
                    {finishedCount}/{total} read
                  </span>
                </div>
                <div className="mt-2">
                  <ProgressBar fraction={total ? finishedCount / total : 0} />
                </div>

                {total > 0 && (
                  <ul className="mt-4 flex flex-col gap-2">
                    {s.books.map((book) => (
                      <li key={book.id} className="flex items-center justify-between gap-2 text-sm">
                        <Link href={`/library/${book.id}`} className="hover:underline">
                          {book.seriesIndex != null ? `#${book.seriesIndex} ` : ""}
                          {book.title}
                        </Link>
                        <StatusBadge status={latestStatus(book.readEntries)} />
                      </li>
                    ))}
                  </ul>
                )}

                <form action={deleteSeries.bind(null, s.id)} className="mt-3">
                  <ConfirmButton
                    message={`Delete series "${s.name}"? Books stay, but lose their series link.`}
                    className="text-xs text-red-700 hover:underline dark:text-red-300"
                  >
                    Delete series
                  </ConfirmButton>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
