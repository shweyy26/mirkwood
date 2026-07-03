import Link from "next/link";
import { getCurrentlyReading, getFinishedEntries, getSettings } from "@/lib/queries";
import { calculatePace } from "@/lib/pace";
import { formatDate, currentYear, fractionOfYearElapsed } from "@/lib/format";
import { genreColor } from "@/lib/genre-colors";
import { ProgressBar } from "@/components/ProgressBar";
import { GenreTag } from "@/components/GenreTag";
import { updateProgress, finishReadEntry, markDNF } from "@/lib/actions/books";
import { updateSettings } from "@/lib/actions/settings";
import { StarRatingInput } from "@/components/StarRating";
import { BookCover } from "@/components/BookCover";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [currentlyReading, settings, finished] = await Promise.all([
    getCurrentlyReading(),
    getSettings(),
    getFinishedEntries(),
  ]);

  const year = currentYear();
  const finishedThisYear = finished.filter((e) => e.endDate?.startsWith(String(year)));
  const goal = settings.yearlyGoal;
  const yearFraction = fractionOfYearElapsed();

  const paceInputs = currentlyReading
    .filter((e) => e.book.totalPages)
    .map((e) => ({
      id: e.id,
      remainingPages: Math.max((e.book.totalPages ?? 0) - e.currentPage, 0),
    }));

  const paceResults = calculatePace(paceInputs, settings);
  const paceById = new Map(paceResults.map((r) => [r.id, r]));

  const totalBooks = finished.length;
  const totalPages = finished.reduce((sum, e) => sum + (e.book.totalPages ?? 0), 0);
  const genreCounts = new Map<string, number>();
  for (const e of finished) {
    const genre = e.book.genre?.trim() || "Unspecified";
    genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
  }
  const genreRows = Array.from(genreCounts.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {settings.displayName ? (
          <p className="font-[family-name:var(--font-logo)] text-3xl text-accent">Hey {settings.displayName} 👋</p>
        ) : (
          <div />
        )}
        <Link
          href="/library/new"
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
        >
          + Add book
        </Link>
      </div>

      <section className="rounded-lg border border-border p-4">
        <h2 className="font-display text-lg font-semibold">{year} reading goal</h2>
        {goal ? (
          <div className="mt-3 flex flex-col gap-2">
            <ProgressBar fraction={finishedThisYear.length / goal} />
            <p className="text-sm text-muted">
              {finishedThisYear.length} / {goal} books finished this year
              {" · "}
              {finishedThisYear.length / goal >= yearFraction ? "on pace 🎉" : "a bit behind pace"}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">No goal set yet — pick a number below.</p>
        )}

        <form action={updateSettings} className="mt-4 flex items-center gap-2">
          <input type="hidden" name="displayName" value={settings.displayName ?? ""} />
          <input type="hidden" name="pagesPerHour" value={settings.pagesPerHour} />
          <input type="hidden" name="weekdayHours" value={settings.weekdayHours} />
          <input type="hidden" name="weekendHours" value={settings.weekendHours} />
          <label className="text-sm" htmlFor="yearlyGoal">
            Books this year:
          </label>
          <input
            id="yearlyGoal"
            type="number"
            min={1}
            name="yearlyGoal"
            defaultValue={goal ?? ""}
            className="w-24 rounded-md border border-border bg-transparent px-2 py-1 text-sm "
          />
          <button type="submit" className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover">
            Save
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-border p-4">
        <h2 className="font-display text-lg font-semibold">Stats</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-4 text-center">
            <p className="text-2xl font-semibold">{totalBooks}</p>
            <p className="text-sm text-muted">Books finished</p>
          </div>
          <div className="rounded-lg border border-border p-4 text-center">
            <p className="text-2xl font-semibold">{totalPages.toLocaleString()}</p>
            <p className="text-sm text-muted">Total pages</p>
          </div>
        </div>

        {genreRows.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {genreRows.map(([genre, count]) => {
              const color = genreColor(genre);
              const widthPct = totalBooks ? (count / totalBooks) * 100 : 0;
              return (
                <div key={genre} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm">{genre}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface">
                    <div className="h-full rounded-full" style={{ width: `${widthPct}%`, backgroundColor: color.dot }} />
                  </div>
                  <span className="w-16 shrink-0 text-right text-sm text-muted">
                    {count} book{count === 1 ? "" : "s"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {currentlyReading.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted  ">
          <p>Nothing in progress right now.</p>
          <Link href="/library" className="mt-2 inline-block text-accent hover:underline">
            Start something from your TBR →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {currentlyReading.map((entry) => {
            const pace = paceById.get(entry.id);
            const pages = entry.book.totalPages;
            const fraction = pages ? entry.currentPage / pages : 0;

            return (
              <div key={entry.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 ">
                <div className="flex items-start gap-3">
                  <BookCover
                    title={entry.book.title}
                    author={entry.book.author}
                    genre={entry.book.genre}
                    isbn={entry.book.isbn}
                    compact
                    className="h-20 w-14 shrink-0"
                  />
                  <div className="flex flex-1 items-start justify-between gap-2">
                    <div>
                      <Link href={`/library/${entry.book.id}`} className="font-medium hover:underline">
                        {entry.book.title}
                      </Link>
                      <p className="text-sm text-muted ">{entry.book.author}</p>
                      <div className="mt-1">
                        <GenreTag genre={entry.book.genre} />
                      </div>
                    </div>
                    {entry.isReread && (
                      <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        Re-read
                      </span>
                    )}
                  </div>
                </div>

                {pages ? (
                  <>
                    <ProgressBar fraction={fraction} />
                    <div className="flex items-center justify-between text-sm text-muted ">
                      <span>
                        {entry.currentPage} / {pages} pages
                      </span>
                      <span>{Math.round(fraction * 100)}%</span>
                    </div>
                    {pace?.estimatedFinishDate ? (
                      <p className="text-sm">
                        Est. finish <strong>{formatDate(pace.estimatedFinishDate)}</strong>
                        {pace.daysRemaining ? ` (~${pace.daysRemaining} days)` : ""}
                      </p>
                    ) : (
                      <p className="text-sm text-muted ">Almost done!</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted ">
                    Add a page count on the book page to get a pace estimate.
                  </p>
                )}

                <form
                  action={async (formData: FormData) => {
                    "use server";
                    const page = Number(formData.get("currentPage"));
                    if (Number.isFinite(page)) await updateProgress(entry.id, page);
                  }}
                  className="flex items-center gap-2"
                >
                  <label className="text-sm text-muted " htmlFor={`page-${entry.id}`}>
                    Update page
                  </label>
                  <input
                    id={`page-${entry.id}`}
                    type="number"
                    name="currentPage"
                    min={0}
                    max={pages ?? undefined}
                    defaultValue={entry.currentPage}
                    className="w-20 rounded-md border border-border bg-transparent px-2 py-1 text-sm "
                  />
                  <button type="submit" className="rounded-md border border-border px-2 py-1 text-sm ">
                    Save
                  </button>
                </form>

                <details className="text-sm">
                  <summary className="cursor-pointer text-muted ">Finish or DNF</summary>
                  <div className="mt-3 flex flex-col gap-3">
                    <form action={finishReadEntry.bind(null, entry.id)} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <label htmlFor={`endDate-${entry.id}`}>End date</label>
                        <input
                          id={`endDate-${entry.id}`}
                          type="date"
                          name="endDate"
                          className="rounded-md border border-border bg-transparent px-2 py-1 text-sm "
                        />
                      </div>
                      <StarRatingInput name="rating" />
                      <textarea
                        name="notes"
                        placeholder="Notes / review"
                        rows={2}
                        className="rounded-md border border-border bg-transparent px-2 py-1 text-sm "
                      />
                      <button
                        type="submit"
                        className="self-start rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-500"
                      >
                        Mark finished
                      </button>
                    </form>
                    <form action={markDNF.bind(null, entry.id)}>
                      <button
                        type="submit"
                        className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                      >
                        Mark as DNF
                      </button>
                    </form>
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
