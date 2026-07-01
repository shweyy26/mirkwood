import { db } from "@/db";
import { books, readEntries, series, settings } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

export async function getSettings() {
  const rows = await db.select().from(settings).where(eq(settings.id, "singleton"));
  if (rows[0]) return rows[0];
  await db.insert(settings).values({ id: "singleton" }).onConflictDoNothing();
  const [row] = await db.select().from(settings).where(eq(settings.id, "singleton"));
  return row;
}

export async function getAllBooksWithEntries() {
  return db.query.books.findMany({
    with: { readEntries: { orderBy: [desc(readEntries.createdAt)] }, series: true },
    orderBy: [desc(books.createdAt)],
  });
}

export async function getBookWithEntries(id: string) {
  return db.query.books.findFirst({
    where: eq(books.id, id),
    with: { readEntries: { orderBy: [desc(readEntries.createdAt)] }, series: true },
  });
}

export async function getCurrentlyReading() {
  return db.query.readEntries.findMany({
    where: eq(readEntries.status, "reading"),
    with: { book: true },
    orderBy: [asc(readEntries.startDate)],
  });
}

export async function getTbrEntries() {
  return db.query.readEntries.findMany({
    where: eq(readEntries.status, "tbr"),
    with: { book: true },
    orderBy: [desc(readEntries.createdAt)],
  });
}

export async function getFinishedEntries() {
  return db.query.readEntries.findMany({
    where: eq(readEntries.status, "finished"),
    with: { book: true },
    orderBy: [desc(readEntries.endDate)],
  });
}

export async function getAllSeriesWithBooks() {
  return db.query.series.findMany({
    with: {
      books: {
        with: { readEntries: true },
        orderBy: [asc(books.seriesIndex)],
      },
    },
    orderBy: [asc(series.name)],
  });
}

export async function getSeriesList() {
  return db.select().from(series).orderBy(asc(series.name));
}

export async function getReadEntry(id: string) {
  return db.query.readEntries.findFirst({
    where: eq(readEntries.id, id),
    with: { book: true },
  });
}
