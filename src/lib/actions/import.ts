"use server";

import { db } from "@/db";
import { books, readEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/user";
import { parseLibraryCsv, type NormalizedBook } from "@/lib/import/parseLibraryCsv";

export interface ImportResult {
  error?: string;
  success?: boolean;
  added?: number;
  skipped?: number;
  total?: number;
}

function titleAuthorKey(title: string, author: string): string {
  return `${title.trim().toLowerCase()}|${author.trim().toLowerCase()}`;
}

export async function importLibrary(_prevState: ImportResult | null, formData: FormData): Promise<ImportResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV file first." };
  }

  const text = await file.text();
  let parsed: { books: NormalizedBook[] };
  try {
    parsed = parseLibraryCsv(text);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not read that CSV file." };
  }

  if (parsed.books.length === 0) {
    return { error: "No books found in that file." };
  }

  const userId = getCurrentUserId();
  const existing = await db
    .select({ title: books.title, author: books.author, isbn: books.isbn })
    .from(books)
    .where(eq(books.userId, userId));

  const existingIsbns = new Set(existing.filter((b) => b.isbn).map((b) => b.isbn as string));
  const existingTitleAuthor = new Set(existing.map((b) => titleAuthorKey(b.title, b.author)));

  let added = 0;
  let skipped = 0;

  for (const book of parsed.books) {
    const isDuplicate =
      (book.isbn && existingIsbns.has(book.isbn)) || existingTitleAuthor.has(titleAuthorKey(book.title, book.author));

    if (isDuplicate) {
      skipped++;
      continue;
    }

    if (book.isbn) existingIsbns.add(book.isbn);
    existingTitleAuthor.add(titleAuthorKey(book.title, book.author));

    const [row] = await db
      .insert(books)
      .values({
        userId,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        totalPages: book.totalPages,
        genre: book.genre,
      })
      .returning();

    for (const entry of book.entries) {
      await db.insert(readEntries).values({ bookId: row.id, ...entry });
    }

    added++;
  }

  revalidatePath("/");
  revalidatePath("/library");
  revalidatePath("/series");
  revalidatePath("/goals");
  revalidatePath("/stats");

  return { success: true, added, skipped, total: parsed.books.length };
}
