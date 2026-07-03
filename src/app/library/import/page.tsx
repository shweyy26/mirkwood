import { ImportForm } from "@/components/ImportForm";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <h1 className="text-2xl font-semibold">Import your library</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        Upload a library export CSV from Goodreads or StoryGraph — it&apos;s auto-detected. Books
        already in your library (matched by ISBN, or title + author) are skipped; only new books
        get added. Re-reads from StoryGraph&apos;s &quot;Dates Read&quot; are imported as separate
        entries where available.
      </p>
      <ImportForm />
    </div>
  );
}
