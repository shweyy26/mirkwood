import { db } from "@/db";
import { books, readEntries, settings } from "@/db/schema";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/user";

/** Books belonging to the current user - used to scope read-entry queries by user. */
function ownBookIds() {
  const userId = getCurrentUserId();
  return db.select({ id: books.id }).from(books).where(eq(books.userId, userId));
}

export async function getSettings() {
  const userId = getCurrentUserId();
  const rows = await db.select().from(settings).where(eq(settings.userId, userId));
  if (rows[0]) return rows[0];
  await db.insert(settings).values({ userId }).onConflictDoNothing();
  const [row] = await db.select().from(settings).where(eq(settings.userId, userId));
  return row;
}

export async function getAllBooksWithEntries() {
  return db.query.books.findMany({
    where: eq(books.userId, getCurrentUserId()),
    with: { readEntries: { orderBy: [desc(readEntries.createdAt)] } },
    orderBy: [desc(books.createdAt)],
  });
}

export async function getBookWithEntries(id: string) {
  return db.query.books.findFirst({
    where: and(eq(books.id, id), eq(books.userId, getCurrentUserId())),
    with: { readEntries: { orderBy: [desc(readEntries.createdAt)] } },
  });
}

export async function getCurrentlyReading() {
  return db.query.readEntries.findMany({
    where: and(eq(readEntries.status, "reading"), inArray(readEntries.bookId, ownBookIds())),
    with: { book: true },
    orderBy: [asc(readEntries.startDate)],
  });
}

export async function getTbrEntries() {
  return db.query.readEntries.findMany({
    where: and(eq(readEntries.status, "tbr"), inArray(readEntries.bookId, ownBookIds())),
    with: { book: true },
    orderBy: [desc(readEntries.createdAt)],
  });
}

export async function getFinishedEntries() {
  return db.query.readEntries.findMany({
    where: and(eq(readEntries.status, "finished"), inArray(readEntries.bookId, ownBookIds())),
    with: { book: true },
    orderBy: [desc(readEntries.endDate)],
  });
}

export async function getReadEntry(id: string) {
  return db.query.readEntries.findFirst({
    where: and(eq(readEntries.id, id), inArray(readEntries.bookId, ownBookIds())),
    with: { book: true },
  });
}
