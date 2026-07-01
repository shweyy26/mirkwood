"use server";

import { db } from "@/db";
import { books, readEntries } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { todayString } from "@/lib/format";
import { getCurrentUserId } from "@/lib/user";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function num(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/library");
  revalidatePath("/series");
  revalidatePath("/goals");
  revalidatePath("/stats");
}

export async function createBook(formData: FormData) {
  const title = str(formData, "title");
  const author = str(formData, "author");
  if (!title || !author) throw new Error("Title and author are required");

  const totalPages = num(formData, "totalPages");
  const genre = str(formData, "genre");
  const seriesId = str(formData, "seriesId");
  const seriesIndex = num(formData, "seriesIndex");
  const initialStatus = (str(formData, "initialStatus") ?? "tbr") as
    | "tbr"
    | "reading"
    | "finished";
  const rating = num(formData, "rating");
  const notes = str(formData, "notes");
  const startDate = str(formData, "startDate");
  const endDate = str(formData, "endDate");
  const currentPage = num(formData, "currentPage");

  const [book] = await db
    .insert(books)
    .values({ userId: getCurrentUserId(), title, author, totalPages, genre, seriesId, seriesIndex })
    .returning();

  await db.insert(readEntries).values({
    bookId: book.id,
    status: initialStatus,
    currentPage: initialStatus === "reading" ? currentPage ?? 0 : 0,
    startDate: initialStatus === "tbr" ? null : startDate ?? todayString(),
    endDate: initialStatus === "finished" ? endDate ?? todayString() : null,
    rating: initialStatus === "finished" ? rating : null,
    notes: initialStatus === "finished" ? notes : null,
  });

  revalidateAll();
  return book.id;
}

export async function updateBook(id: string, formData: FormData) {
  const title = str(formData, "title");
  const author = str(formData, "author");
  if (!title || !author) throw new Error("Title and author are required");

  await db
    .update(books)
    .set({
      title,
      author,
      totalPages: num(formData, "totalPages"),
      genre: str(formData, "genre"),
      seriesId: str(formData, "seriesId"),
      seriesIndex: num(formData, "seriesIndex"),
      updatedAt: new Date(),
    })
    .where(and(eq(books.id, id), eq(books.userId, getCurrentUserId())));

  revalidateAll();
}

export async function deleteBook(id: string) {
  await db.delete(books).where(and(eq(books.id, id), eq(books.userId, getCurrentUserId())));
  revalidateAll();
}

export async function startReading(readEntryId: string, startDate?: string) {
  await db
    .update(readEntries)
    .set({ status: "reading", startDate: startDate ?? todayString(), currentPage: 0, updatedAt: new Date() })
    .where(eq(readEntries.id, readEntryId));
  revalidateAll();
}

export async function updateProgress(readEntryId: string, currentPage: number) {
  await db
    .update(readEntries)
    .set({ currentPage, updatedAt: new Date() })
    .where(eq(readEntries.id, readEntryId));
  revalidateAll();
}

export async function finishReadEntry(readEntryId: string, formData: FormData) {
  const rating = num(formData, "rating");
  const notes = str(formData, "notes");
  const endDate = str(formData, "endDate") ?? todayString();

  await db
    .update(readEntries)
    .set({ status: "finished", endDate, rating, notes, updatedAt: new Date() })
    .where(eq(readEntries.id, readEntryId));

  revalidateAll();
}

export async function markDNF(readEntryId: string, formData?: FormData) {
  const notes = formData ? str(formData, "notes") : null;
  await db
    .update(readEntries)
    .set({ status: "dnf", endDate: todayString(), notes, updatedAt: new Date() })
    .where(eq(readEntries.id, readEntryId));
  revalidateAll();
}

export async function rereadBook(bookId: string, startDate?: string) {
  await db.insert(readEntries).values({
    bookId,
    status: "reading",
    isReread: true,
    currentPage: 0,
    startDate: startDate ?? todayString(),
  });
  revalidateAll();
}

export async function updateReadEntry(readEntryId: string, formData: FormData) {
  await db
    .update(readEntries)
    .set({
      startDate: str(formData, "startDate"),
      endDate: str(formData, "endDate"),
      rating: num(formData, "rating"),
      notes: str(formData, "notes"),
      updatedAt: new Date(),
    })
    .where(eq(readEntries.id, readEntryId));
  revalidateAll();
}

export async function deleteReadEntry(readEntryId: string) {
  await db.delete(readEntries).where(eq(readEntries.id, readEntryId));
  revalidateAll();
}
