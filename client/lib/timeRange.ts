import type { Activity } from "@/types/activity";

export type TimeRange = "daily" | "weekly" | "monthly" | "yearly";

export const timeRangeOptions: { label: string; value: TimeRange }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" }
];

const toDayKey = (date: Date) => date.toISOString().slice(0, 10);

const startOfWeek = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

export const filterActivitiesByRange = (activities: Activity[], range: TimeRange, now = new Date()) => {
  const today = toDayKey(now);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  return activities.filter((activity) => {
    if (range === "daily") return activity.date === today;
    if (range === "monthly") return activity.date.startsWith(`${year}-${month}`);
    if (range === "yearly") return activity.date.startsWith(year);

    const activityDate = new Date(`${activity.date}T00:00:00`);
    return activityDate >= weekStart && activityDate < weekEnd;
  });
};
