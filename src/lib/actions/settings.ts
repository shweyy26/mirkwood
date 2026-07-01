"use server";

import { db } from "@/db";
import { settings } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function updateSettings(formData: FormData) {
  const pagesPerHour = Number(formData.get("pagesPerHour"));
  const weekdayHours = Number(formData.get("weekdayHours"));
  const weekendHours = Number(formData.get("weekendHours"));
  const yearlyGoalRaw = formData.get("yearlyGoal");
  const yearlyGoal =
    typeof yearlyGoalRaw === "string" && yearlyGoalRaw.trim() !== "" ? Number(yearlyGoalRaw) : null;

  const values = {
    pagesPerHour: Number.isFinite(pagesPerHour) && pagesPerHour > 0 ? pagesPerHour : 40,
    weekdayHours: Number.isFinite(weekdayHours) ? weekdayHours : 1,
    weekendHours: Number.isFinite(weekendHours) ? weekendHours : 3,
    yearlyGoal,
    updatedAt: new Date(),
  };

  await db
    .insert(settings)
    .values({ id: "singleton", ...values })
    .onConflictDoUpdate({ target: settings.id, set: values });

  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/goals");
}
