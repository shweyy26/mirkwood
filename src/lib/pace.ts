export interface PaceSettings {
  pagesPerHour: number;
  weekdayHours: number;
  weekendHours: number;
}

export interface PaceInputBook {
  id: string;
  remainingPages: number;
}

export interface PaceResult {
  id: string;
  remainingPages: number;
  estimatedFinishDate: Date | null;
  daysRemaining: number | null;
}

const MAX_SIMULATION_DAYS = 365 * 10;

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/** Hours available for reading in a full week, given the weekday/weekend split. */
export function weeklyReadingHours(settings: Pick<PaceSettings, "weekdayHours" | "weekendHours">): number {
  return settings.weekdayHours * 5 + settings.weekendHours * 2;
}

/**
 * Simulates reading day by day, splitting each day's available hours evenly
 * across every book still in progress, to estimate a finish date per book.
 */
export function calculatePace(
  books: PaceInputBook[],
  settings: PaceSettings,
  from: Date = new Date()
): PaceResult[] {
  const remaining = new Map(books.map((b) => [b.id, b.remainingPages]));
  const finishDate = new Map<string, Date | null>();
  const daysRemaining = new Map<string, number | null>();

  for (const b of books) {
    if (b.remainingPages <= 0) {
      finishDate.set(b.id, from);
      daysRemaining.set(b.id, 0);
      remaining.set(b.id, 0);
    }
  }

  const stillActive = () =>
    books.filter((b) => (remaining.get(b.id) ?? 0) > 0 && !finishDate.has(b.id));

  if (settings.pagesPerHour <= 0) {
    return books.map((b) => ({
      id: b.id,
      remainingPages: b.remainingPages,
      estimatedFinishDate: finishDate.get(b.id) ?? null,
      daysRemaining: daysRemaining.get(b.id) ?? null,
    }));
  }

  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);

  for (let day = 0; day < MAX_SIMULATION_DAYS; day++) {
    const active = stillActive();
    if (active.length === 0) break;

    const hoursToday = isWeekend(cursor) ? settings.weekendHours : settings.weekdayHours;
    if (hoursToday > 0) {
      const hoursPerBook = hoursToday / active.length;
      const pagesPerBook = hoursPerBook * settings.pagesPerHour;

      for (const b of active) {
        const left = (remaining.get(b.id) ?? 0) - pagesPerBook;
        remaining.set(b.id, left);
        if (left <= 0) {
          finishDate.set(b.id, new Date(cursor));
          daysRemaining.set(b.id, day + 1);
        }
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return books.map((b) => ({
    id: b.id,
    remainingPages: b.remainingPages,
    estimatedFinishDate: finishDate.get(b.id) ?? null,
    daysRemaining: daysRemaining.get(b.id) ?? null,
  }));
}

/** Rough estimate of how many books/year are realistically achievable given a reading pace. */
export function estimateBooksPerYear(settings: PaceSettings, avgPagesPerBook: number): number {
  if (avgPagesPerBook <= 0) return 0;
  const annualPages = weeklyReadingHours(settings) * 52 * settings.pagesPerHour;
  return annualPages / avgPagesPerBook;
}
