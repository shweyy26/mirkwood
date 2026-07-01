import Link from "next/link";
import { getCurrentlyReading, getFinishedEntries, getSettings } from "@/lib/queries";
import { calculatePace, weeklyReadingHours } from "@/lib/pace";
import { formatDate, currentYear } from "@/lib/format";
import { ProgressBar } from "@/components/ProgressBar";
import { GenreTag } from "@/components/GenreTag";
import { updateProgress, finishReadEntry, markDNF } from "@/lib/actions/books";
import { StarRatingInput } from "@/components/StarRating";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [currentlyReading, settings, finished] = await Promise.all([
    getCurrentlyReading(),
    getSettings(),
    getFinishedEntries(),
  ]);

  const year = currentYear();
  const finishedThisYear = finished.filter((e) => e.endDate?.startsWith(String(year))).length;

  const paceInputs = currentlyReading
    .filter((e) => e.book.totalPages)
    .map((e) => ({
      id: e.id,
      remainingPages: Math.max((e.book.totalPages ?? 0) - e.currentPage, 0),
    }));

  const paceResults = calculatePace(paceInputs, settings);
  const paceById = new Map(paceResults.map((r) => [r.id, r]));
  const weeklyHours = weeklyReadingHours(settings);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Currently reading</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Estimate based on {settings.weekdayHours}h/weekday + {settings.weekendHours}h/weekend day (
            {weeklyHours}h/week) at {settings.pagesPerHour} pages/hour.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/library/new"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            + Add book
          </Link>
          {settings.yearlyGoal ? (
            <Link
              href="/goals"
              className="rounded-md border border-black/15 px-3 py-2 text-sm font-medium dark:border-white/20"
            >
              {finishedThisYear}/{settings.yearlyGoal} goal
            </Link>
          ) : null}
        </div>
      </div>

      {currentlyReading.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 p-8 text-center text-black/60 dark:border-white/20 dark:text-white/60">
          <p>Nothing in progress right now.</p>
          <Link href="/library" className="mt-2 inline-block text-blue-600 hover:underline dark:text-blue-400">
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
              <div key={entry.id} className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/10">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/library/${entry.book.id}`} className="font-medium hover:underline">
                      {entry.book.title}
                    </Link>
                    <p className="text-sm text-black/60 dark:text-white/60">{entry.book.author}</p>
                  </div>
                  {entry.isReread && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      Re-read
                    </span>
                  )}
                </div>

                <GenreTag genre={entry.book.genre} />

                {pages ? (
                  <>
                    <ProgressBar fraction={fraction} />
                    <div className="flex items-center justify-between text-sm text-black/60 dark:text-white/60">
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
                      <p className="text-sm text-black/50 dark:text-white/50">Almost done!</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-black/50 dark:text-white/50">
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
                  <label className="text-sm text-black/60 dark:text-white/60" htmlFor={`page-${entry.id}`}>
                    Update page
                  </label>
                  <input
                    id={`page-${entry.id}`}
                    type="number"
                    name="currentPage"
                    min={0}
                    max={pages ?? undefined}
                    defaultValue={entry.currentPage}
                    className="w-20 rounded-md border border-black/15 bg-transparent px-2 py-1 text-sm dark:border-white/20"
                  />
                  <button type="submit" className="rounded-md border border-black/15 px-2 py-1 text-sm dark:border-white/20">
                    Save
                  </button>
                </form>

                <details className="text-sm">
                  <summary className="cursor-pointer text-black/60 dark:text-white/60">Finish or DNF</summary>
                  <div className="mt-3 flex flex-col gap-3">
                    <form action={finishReadEntry.bind(null, entry.id)} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <label htmlFor={`endDate-${entry.id}`}>End date</label>
                        <input
                          id={`endDate-${entry.id}`}
                          type="date"
                          name="endDate"
                          className="rounded-md border border-black/15 bg-transparent px-2 py-1 text-sm dark:border-white/20"
                        />
                      </div>
                      <StarRatingInput name="rating" />
                      <textarea
                        name="notes"
                        placeholder="Notes / review"
                        rows={2}
                        className="rounded-md border border-black/15 bg-transparent px-2 py-1 text-sm dark:border-white/20"
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
