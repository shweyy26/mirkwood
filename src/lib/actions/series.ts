"use server";

import { db } from "@/db";
import { series } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/user";

export async function createSeries(formData: FormData) {
  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) throw new Error("Series name is required");

  const [row] = await db
    .insert(series)
    .values({ userId: getCurrentUserId(), name: name.trim() })
    .returning();
  revalidatePath("/series");
  revalidatePath("/library");
  return row.id;
}

export async function renameSeries(id: string, formData: FormData) {
  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) throw new Error("Series name is required");

  await db
    .update(series)
    .set({ name: name.trim() })
    .where(and(eq(series.id, id), eq(series.userId, getCurrentUserId())));
  revalidatePath("/series");
  revalidatePath("/library");
}

export async function deleteSeries(id: string) {
  await db.delete(series).where(and(eq(series.id, id), eq(series.userId, getCurrentUserId())));
  revalidatePath("/series");
  revalidatePath("/library");
}
