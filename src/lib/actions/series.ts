"use server";

import { db } from "@/db";
import { series } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createSeries(formData: FormData) {
  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) throw new Error("Series name is required");

  const [row] = await db.insert(series).values({ name: name.trim() }).returning();
  revalidatePath("/series");
  revalidatePath("/library");
  return row.id;
}

export async function renameSeries(id: string, formData: FormData) {
  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) throw new Error("Series name is required");

  await db.update(series).set({ name: name.trim() }).where(eq(series.id, id));
  revalidatePath("/series");
  revalidatePath("/library");
}

export async function deleteSeries(id: string) {
  await db.delete(series).where(eq(series.id, id));
  revalidatePath("/series");
  revalidatePath("/library");
}
