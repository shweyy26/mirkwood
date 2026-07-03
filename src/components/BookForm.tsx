"use client";

import { useState } from "react";
import type { Series } from "@/db/schema";
import { StarRatingInput } from "./StarRating";
import { todayString } from "@/lib/format";

const inputClass =
  "w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm ";
const labelClass = "block text-sm font-medium mb-1";

export function BookForm({
  seriesList,
  action,
}: {
  seriesList: Series[];
  action: (formData: FormData) => void;
}) {
  const [status, setStatus] = useState<"tbr" | "reading" | "finished">("tbr");

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="title">
            Title
          </label>
          <input required id="title" name="title" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="author">
            Author
          </label>
          <input required id="author" name="author" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="totalPages">
            Total pages
          </label>
          <input type="number" min={1} id="totalPages" name="totalPages" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="genre">
            Genre
          </label>
          <input id="genre" name="genre" className={inputClass} placeholder="Fantasy" />
        </div>
        <div>
          <label className={labelClass} htmlFor="seriesId">
            Series (optional)
          </label>
          <select id="seriesId" name="seriesId" className={inputClass} defaultValue="">
            <option value="">None</option>
            {seriesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="seriesIndex">
            Book # in series
          </label>
          <input type="number" step="0.5" min={0} id="seriesIndex" name="seriesIndex" className={inputClass} />
        </div>
      </div>

      <fieldset className="rounded-md border border-border p-4 ">
        <legend className="px-1 text-sm font-medium">Status</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          {(
            [
              { value: "tbr", label: "To be read" },
              { value: "reading", label: "Currently reading" },
              { value: "finished", label: "Already finished" },
            ] as const
          ).map((opt) => (
            <label key={opt.value} className="flex items-center gap-2">
              <input
                type="radio"
                name="initialStatus"
                value={opt.value}
                checked={status === opt.value}
                onChange={() => setStatus(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>

        {status === "reading" && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="startDate">
                Start date
              </label>
              <input type="date" id="startDate" name="startDate" defaultValue={todayString()} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="currentPage">
                Current page
              </label>
              <input type="number" min={0} id="currentPage" name="currentPage" defaultValue={0} className={inputClass} />
            </div>
          </div>
        )}

        {status === "finished" && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="startDate2">
                Start date
              </label>
              <input type="date" id="startDate2" name="startDate" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="endDate">
                End date
              </label>
              <input type="date" id="endDate" name="endDate" defaultValue={todayString()} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Rating</label>
              <StarRatingInput name="rating" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="notes">
                Notes / review
              </label>
              <textarea id="notes" name="notes" rows={3} className={inputClass} />
            </div>
          </div>
        )}
      </fieldset>

      <button
        type="submit"
        className="self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
      >
        Add book
      </button>
    </form>
  );
}
