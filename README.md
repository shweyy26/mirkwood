# Reading Tracker

A personal reading tracker. No accounts, no login — the app is meant to be deployed
to a URL only you know, and a shared Postgres database keeps it in sync across
every device you open that URL from.

## Features

- **Library**: track books as To Be Read, Currently Reading, Finished, or DNF.
- **Finished books**: star rating, notes/review, start & end date stamps (no
  per-book time tracking — just the dates, like StoryGraph/Goodreads).
- **Currently reading**: live page-progress tracker with a pace estimate —
  finish-date projections computed by simulating your reading week (default:
  1h/weekday, 3h/weekend day, configurable in Settings) split across everything
  you're reading at once.
- **Series tracking**: group books into a series, see `x / y read` progress.
- **Re-read tracking**: "Read it again" starts a brand new read entry for a book
  without touching the history of your earlier read(s).
- **Yearly goals**: set a books-per-year target, see progress vs. how far the
  year has gotten, and a "realistic goal" calculator that turns your TBR size +
  reading pace into a sane target.
- **Stats**: books finished, total pages, genre breakdown (color-coded), all-time
  or by year.

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

- `books` — title, author, page count, genre, optional series + position.
- `read_entries` — one row per *read* of a book (status: tbr / reading /
  finished / dnf; start/end dates; rating; notes; current page while reading).
  A book can have multiple entries over time — that's how re-reads are tracked
  without losing the original read's rating/notes/dates.
- `series` — just a name; books reference it optionally.
- `settings` — a single row: reading speed (pages/hour), weekday/weekend
  reading hours, and the yearly goal. Drives the pace and goal calculators.
