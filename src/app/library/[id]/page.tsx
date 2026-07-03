import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { getBookWithEntries, getSeriesList } from "@/lib/queries";
import {
  updateBook,
  deleteBook,
  startReading,
  updateProgress,
  finishReadEntry,
  markDNF,
  rereadBook,
  updateReadEntry,
  deleteReadEntry,
} from "@/lib/actions/books";
import { StatusBadge } from "@/components/StatusBadge";
import { StarRatingDisplay, StarRatingInput } from "@/components/StarRating";
import { ProgressBar } from "@/components/ProgressBar";
import { ConfirmButton } from "@/components/ConfirmButton";
import { formatDate } from "@/lib/format";
import type { ReadEntry } from "@/db/schema";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm ";
const labelClass = "block text-sm font-medium mb-1";

function sortEntries(entries: ReadEntry[]) {
  return [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [book, seriesList] = await Promise.all([getBookWithEntries(id), getSeriesList()]);
  if (!book) notFound();

  const entries = sortEntries(book.readEntries);
  const activeEntry = entries.find((e) => e.status === "tbr" || e.status === "reading");
  const pastEntries = entries.filter((e) => e.status === "finished" || e.status === "dnf");

  async function deleteAction() {
    "use server";
    await deleteBook(id);
    redirect("/library");
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{book.title}</h1>
          <p className="text-muted ">{book.author}</p>
        </div>
        {activeEntry && <StatusBadge status={activeEntry.status} />}
      </div>

      {/* Status actions */}
      <section className="rounded-lg border border-border p-4 ">
        {activeEntry?.status === "tbr" && (
          <form action={startReading.bind(null, activeEntry.id, undefined)}>
            <button type="submit" className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover">
              Start reading
            </button>
          </form>
        )}

        {activeEntry?.status === "reading" && (
          <div className="flex flex-col gap-4">
            {book.totalPages ? (
              <>
                <ProgressBar fraction={activeEntry.currentPage / book.totalPages} />
                <p className="text-sm text-muted ">
                  {activeEntry.currentPage} / {book.totalPages} pages · started {formatDate(activeEntry.startDate)}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted ">Started {formatDate(activeEntry.startDate)}</p>
            )}

            <form
              action={async (formData: FormData) => {
                "use server";
                const page = Number(formData.get("currentPage"));
                if (Number.isFinite(page)) await updateProgress(activeEntry.id, page);
              }}
              className="flex items-center gap-2"
            >
              <label className="text-sm" htmlFor="currentPage">
                Update page
              </label>
              <input
                id="currentPage"
                type="number"
                name="currentPage"
                min={0}
                max={book.totalPages ?? undefined}
                defaultValue={activeEntry.currentPage}
                className="w-24 rounded-md border border-border bg-transparent px-2 py-1 text-sm "
              />
              <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-sm ">
                Save
              </button>
            </form>

            <div className="grid gap-4 sm:grid-cols-2">
              <form action={finishReadEntry.bind(null, activeEntry.id)} className="flex flex-col gap-2">
                <div>
                  <label className={labelClass} htmlFor="endDate">
                    End date
                  </label>
                  <input id="endDate" type="date" name="endDate" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Rating</label>
                  <StarRatingInput name="rating" />
                </div>
                <div>
                  <label className={labelClass} htmlFor="notes">
                    Notes / review
                  </label>
                  <textarea id="notes" name="notes" rows={3} className={inputClass} />
                </div>
                <button type="submit" className="self-start rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-500">
                  Mark finished
                </button>
              </form>

              <form action={markDNF.bind(null, activeEntry.id)} className="flex flex-col gap-2">
                <label className={labelClass} htmlFor="dnfNotes">
                  Why did you stop? (optional)
                </label>
                <textarea id="dnfNotes" name="notes" rows={3} className={inputClass} />
                <button
                  type="submit"
                  className="self-start rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                >
                  Mark as DNF
                </button>
              </form>
            </div>
          </div>
        )}

        {!activeEntry && (
          <form action={rereadBook.bind(null, book.id, undefined)}>
            <button type="submit" className="rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-500">
              Read it again
            </button>
          </form>
        )}
      </section>

      {/* Read history */}
      {pastEntries.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Read history</h2>
          {pastEntries.map((entry) => (
            <details key={entry.id} className="rounded-lg border border-border p-4 ">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <StatusBadge status={entry.status} />
                  {entry.isReread && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      Re-read
                    </span>
                  )}
                  <span className="text-sm text-muted ">
                    {formatDate(entry.startDate)} → {formatDate(entry.endDate)}
                  </span>
                </span>
                {entry.status === "finished" && <StarRatingDisplay rating={entry.rating} />}
              </summary>

              <form action={updateReadEntry.bind(null, entry.id)} className="mt-4 flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor={`start-${entry.id}`}>
                      Start date
                    </label>
                    <input
                      id={`start-${entry.id}`}
                      type="date"
                      name="startDate"
                      defaultValue={entry.startDate ?? ""}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`end-${entry.id}`}>
                      End date
                    </label>
                    <input
                      id={`end-${entry.id}`}
                      type="date"
                      name="endDate"
                      defaultValue={entry.endDate ?? ""}
                      className={inputClass}
                    />
                  </div>
                </div>
                {entry.status === "finished" && (
                  <div>
                    <label className={labelClass}>Rating</label>
                    <StarRatingInput name="rating" defaultValue={entry.rating} />
                  </div>
                )}
                <div>
                  <label className={labelClass} htmlFor={`notes-${entry.id}`}>
                    Notes
                  </label>
                  <textarea
                    id={`notes-${entry.id}`}
                    name="notes"
                    rows={2}
                    defaultValue={entry.notes ?? ""}
                    className={inputClass}
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-sm ">
                    Save changes
                  </button>
                </div>
              </form>
              <form action={deleteReadEntry.bind(null, entry.id)} className="mt-2">
                <ConfirmButton
                  message="Delete this read entry? This can't be undone."
                  className="text-sm text-red-700 hover:underline dark:text-red-300"
                >
                  Delete this entry
                </ConfirmButton>
              </form>
            </details>
          ))}
        </section>
      )}

      {/* Edit book details */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Book details</h2>
        <form action={updateBook.bind(null, book.id)} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="title">
                Title
              </label>
              <input required id="title" name="title" defaultValue={book.title} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="author">
                Author
              </label>
              <input required id="author" name="author" defaultValue={book.author} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="totalPages">
                Total pages
              </label>
              <input
                type="number"
                min={1}
                id="totalPages"
                name="totalPages"
                defaultValue={book.totalPages ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="genre">
                Genre
              </label>
              <input id="genre" name="genre" defaultValue={book.genre ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="seriesId">
                Series
              </label>
              <select id="seriesId" name="seriesId" defaultValue={book.seriesId ?? ""} className={inputClass}>
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
              <input
                type="number"
                step="0.5"
                min={0}
                id="seriesIndex"
                name="seriesIndex"
                defaultValue={book.seriesIndex ?? ""}
                className={inputClass}
              />
            </div>
          </div>
          <button type="submit" className="self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover">
            Save details
          </button>
        </form>

        <form action={deleteAction} className="mt-2">
          <ConfirmButton
            message={`Delete "${book.title}" and all its read history? This can't be undone.`}
            className="text-sm text-red-700 hover:underline dark:text-red-300"
          >
            Delete this book
          </ConfirmButton>
        </form>
      </section>
    </div>
  );
}
