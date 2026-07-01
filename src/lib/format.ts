/** All dates in this app are plain YYYY-MM-DD strings (no time-of-day, no timezone). */

export function todayString(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateShort(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function fractionOfYearElapsed(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1).getTime();
  const end = new Date(now.getFullYear() + 1, 0, 1).getTime();
  return (now.getTime() - start) / (end - start);
}
