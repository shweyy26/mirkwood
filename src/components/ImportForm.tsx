"use client";

import { useActionState } from "react";
import { importLibrary, type ImportResult } from "@/lib/actions/import";

const initialState: ImportResult | null = null;

export function ImportForm() {
  const [state, formAction, pending] = useActionState(importLibrary, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="file">
          Library export file (.csv)
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm "
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Importing…" : "Import"}
      </button>

      {state?.error && <p className="text-sm text-red-700 dark:text-red-300">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-green-700 dark:text-green-400">
          Imported {state.added} new book{state.added === 1 ? "" : "s"} out of {state.total}
          {state.skipped ? ` · skipped ${state.skipped} already in your library` : ""}.
        </p>
      )}
    </form>
  );
}
