import { getSettings } from "@/lib/queries";
import { updateSettings } from "@/lib/actions/settings";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20";
const labelClass = "block text-sm font-medium mb-1";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        These numbers drive the pace estimates on the Dashboard and Goals pages.
      </p>

      <form action={updateSettings} className="flex flex-col gap-4">
        <div>
          <label className={labelClass} htmlFor="pagesPerHour">
            Reading speed (pages/hour)
          </label>
          <input
            id="pagesPerHour"
            type="number"
            min={1}
            name="pagesPerHour"
            defaultValue={settings.pagesPerHour}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="weekdayHours">
            Hours per weekday
          </label>
          <input
            id="weekdayHours"
            type="number"
            step="0.25"
            min={0}
            name="weekdayHours"
            defaultValue={settings.weekdayHours}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="weekendHours">
            Hours per weekend day
          </label>
          <input
            id="weekendHours"
            type="number"
            step="0.25"
            min={0}
            name="weekendHours"
            defaultValue={settings.weekendHours}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="yearlyGoal">
            Yearly reading goal (books)
          </label>
          <input
            id="yearlyGoal"
            type="number"
            min={1}
            name="yearlyGoal"
            defaultValue={settings.yearlyGoal ?? ""}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          className="self-start rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Save settings
        </button>
      </form>
    </div>
  );
}
