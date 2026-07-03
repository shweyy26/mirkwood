# Reading Tracker

A personal reading tracker. No accounts, no login — the app is meant to be deployed
to a URL only you know, and a shared Postgres database keeps it in sync across
every device you open that URL from.

## Features

- **Library**: track books as To Be Read, Currently Reading, Finished, or DNF —
  shown as a cover-art grid, with a count next to each status filter. Covers are
  fetched automatically from Open Library by ISBN; books without one (or without
  a match) get a colorful genre-tinted placeholder instead.
- **Finished books**: star rating, notes/review, start & end date stamps (no
  per-book time tracking — just the dates, like StoryGraph/Goodreads).
- **Currently reading**: live page-progress tracker with a pace estimate —
  finish-date projections computed by simulating your reading week (default:
  1h/weekday, 3h/weekend day, configurable in Settings) split across everything
  you're reading at once.
- **Re-read tracking**: "Read it again" starts a brand new read entry for a book
  without touching the history of your earlier read(s).
- **Dashboard**: a personal greeting, your yearly reading goal (set a books-per-year
  target, see progress vs. how far the year has gotten), stats (books finished,
  total pages, genre breakdown), and your currently-reading list — all on one page.
- **CSV import**: upload a Goodreads or StoryGraph library export (`/library/import`,
  format auto-detected) to bulk-add books. Books already in your library (matched
  by ISBN, or title + author) are skipped. StoryGraph's "Dates Read" field is
  parsed into separate read entries, so past re-reads come in with real dates.

## Tech stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Drizzle ORM + PostgreSQL
- No auth — the app is unlisted by URL only (see Deployment below)

## Local development

1. Have a Postgres database available (local Postgres, or a free one from
   [Neon](https://neon.tech) / [Supabase](https://supabase.com)).
2. Copy `.env.example` to `.env` and set `DATABASE_URL`.
3. Install dependencies and push the schema:
   ```bash
   npm install
   npm run db:migrate
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```

Other useful scripts:
- `npm run db:generate` — generate a new SQL migration after changing `src/db/schema.ts`
- `npm run db:migrate` — apply migrations
- `npm run db:studio` — browse the database in Drizzle Studio

## Deployment (unlisted URL + synced database)

1. Create a free Postgres database on [Neon](https://neon.tech) or
   [Supabase](https://supabase.com) and copy its connection string.
2. Deploy this repo to [Vercel](https://vercel.com) (or any Next.js host):
   - Set the `DATABASE_URL` environment variable to your connection string.
   - Run `npm run db:migrate` once (locally, pointed at the production
     `DATABASE_URL`, or via a one-off deploy hook) to create the tables.
3. Vercel gives you a URL like `your-project-xyz123.vercel.app` — that's your
   "unlisted" link. There's no login screen; anyone with the URL can use the
   app, so just don't share it. If you want an extra layer, Vercel's
   [Deployment Protection](https://vercel.com/docs/deployment-protection) can
   put a password/SSO gate in front of the whole app without any changes here.

Because there's a single shared database and no per-user accounts, every
device that opens the URL sees the same library — that's what makes it sync.

## Data model

- `books` — title, author, page count, genre, ISBN.
- `read_entries` — one row per *read* of a book (status: tbr / reading /
  finished / dnf; start/end dates; rating; notes; current page while reading).
  A book can have multiple entries over time — that's how re-reads are tracked
  without losing the original read's rating/notes/dates.
- `settings` — a single row: reading speed (pages/hour), weekday/weekend
  reading hours, and the yearly goal. Drives the pace and goal calculators.

### Multi-user readiness (not active yet)

There's no login. `books` and `settings` both carry a `user_id` column, but
every row is currently stamped with a single fixed id (`src/lib/user.ts`).
This means adding real accounts later is mostly a matter of replacing
`getCurrentUserId()` with a real session lookup — the schema and every
query/action already scope by user id.

`books.isbn` is used both to fetch a cover image (via Open Library) and by the
CSV import above to detect duplicates.
