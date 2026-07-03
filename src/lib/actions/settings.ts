"use server";

import { db } from "@/db";
import { settings } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/user";

export async function updateSettings(formData: FormData) {
  const pagesPerHour = Number(formData.get("pagesPerHour"));
  const weekdayHours = Number(formData.get("weekdayHours"));
  const weekendHours = Number(formData.get("weekendHours"));
  const yearlyGoalRaw = formData.get("yearlyGoal");
  const yearlyGoal =
    typeof yearlyGoalRaw === "string" && yearlyGoalRaw.trim() !== "" ? Number(yearlyGoalRaw) : null;
  const displayNameRaw = formData.get("displayName");
  const displayName = typeof displayNameRaw === "string" && displayNameRaw.trim() !== "" ? displayNameRaw.trim() : null;

  const values = {
    displayName,
    pagesPerHour: Number.isFinite(pagesPerHour) && pagesPerHour > 0 ? pagesPerHour : 40,
    weekdayHours: Number.isFinite(weekdayHours) ? weekdayHours : 1,
    weekendHours: Number.isFinite(weekendHours) ? weekendHours : 3,
    yearlyGoal,
    updatedAt: new Date(),
  };

  const userId = getCurrentUserId();
  await db
    .insert(settings)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: settings.userId, set: values });

  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/goals");
}
