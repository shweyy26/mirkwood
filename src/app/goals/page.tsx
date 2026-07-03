import { getFinishedEntries, getTbrEntries, getSettings } from "@/lib/queries";
import { estimateBooksPerYear, weeklyReadingHours } from "@/lib/pace";
import { currentYear, fractionOfYearElapsed } from "@/lib/format";
import { ProgressBar } from "@/components/ProgressBar";
import { updateSettings } from "@/lib/actions/settings";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const [finished, tbr, settings] = await Promise.all([getFinishedEntries(), getTbrEntries(), getSettings()]);

  const year = currentYear();
  const finishedThisYear = finished.filter((e) => e.endDate?.startsWith(String(year)));
  const goal = settings.yearlyGoal;
  const yearFraction = fractionOfYearElapsed();

  const finishedWithPages = finished.filter((e) => e.book.totalPages);
  const avgPagesPerBook = finishedWithPages.length
    ? finishedWithPages.reduce((sum, e) => sum + (e.book.totalPages ?? 0), 0) / finishedWithPages.length
    : 300; // fallback assumption until enough finished books have page counts

  const realisticBooksPerYear = estimateBooksPerYear(settings, avgPagesPerBook);
  const weeklyHours = weeklyReadingHours(settings);

  const tbrPageTotal = tbr.reduce((sum, e) => sum + (e.book.totalPages ?? 0), 0);
  const annualPageCapacity = weeklyHours * 52 * settings.pagesPerHour;
  const yearsToClearTbr = tbrPageTotal > 0 && annualPageCapacity > 0 ? tbrPageTotal / annualPageCapacity : 0;

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <h1 className="text-2xl font-semibold">Goals</h1>

      <section className="rounded-lg border border-border p-4 ">
        <h2 className="text-lg font-medium">{year} reading goal</h2>
        {goal ? (
          <div className="mt-3 flex flex-col gap-2">
            <ProgressBar fraction={goal ? finishedThisYear.length / goal : 0} />
            <p className="text-sm text-muted ">
              {finishedThisYear.length} / {goal} books finished this year
              {" · "}
              {finishedThisYear.length / goal >= yearFraction ? "on pace 🎉" : "a bit behind pace"}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted ">No goal set yet — pick a number below.</p>
        )}

        <form action={updateSettings} className="mt-4 flex items-center gap-2">
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

      <section className="rounded-lg border border-border p-4 ">
        <h2 className="text-lg font-medium">Realistic goal helper</h2>
        <p className="mt-2 text-sm text-muted ">
          At {settings.weekdayHours}h/weekday + {settings.weekendHours}h/weekend day ({weeklyHours}h/week) and{" "}
          {settings.pagesPerHour} pages/hour, you can read roughly{" "}
          <strong>{Math.round(annualPageCapacity).toLocaleString()} pages/year</strong>.
        </p>
        <p className="mt-2 text-sm text-muted ">
          Based on an average book length of ~{Math.round(avgPagesPerBook)} pages, that&apos;s about{" "}
          <strong>{realisticBooksPerYear.toFixed(1)} books/year</strong> — a reasonable target is{" "}
          <strong>{Math.floor(realisticBooksPerYear)}</strong> to{" "}
          <strong>{Math.ceil(realisticBooksPerYear)}</strong> books.
        </p>
        {tbrPageTotal > 0 && (
          <p className="mt-2 text-sm text-muted ">
            Your TBR has {tbr.length} book{tbr.length === 1 ? "" : "s"} ({tbrPageTotal.toLocaleString()} pages). At this
            pace, clearing it entirely would take about{" "}
            <strong>{yearsToClearTbr < 1 ? `${Math.round(yearsToClearTbr * 52)} weeks` : `${yearsToClearTbr.toFixed(1)} years`}</strong>
            .
          </p>
        )}
        <p className="mt-3 text-xs text-muted ">
          Adjust your reading speed and available hours on the Settings page to refine this estimate.
        </p>
      </section>
    </div>
  );
}
