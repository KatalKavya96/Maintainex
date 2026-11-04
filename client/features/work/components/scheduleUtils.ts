import { dueLabel } from "@/shared/lib/workDates";
import type { ScheduledWorkStatus } from "@/types/scheduledWork";

const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());

export function assignedDuration(assignedSince?: string | null) {
  if (!assignedSince) return "";
  const days = Math.max(Math.floor((startOfDay(new Date()).getTime() - startOfDay(new Date(assignedSince)).getTime()) / 86400000), 0);
  return `Assigned for ${days} day${days === 1 ? "" : "s"}`;
}

export { dueLabel as dueStatus } from "@/shared/lib/workDates";

export function isOverdue(dueDate?: string | null, status?: ScheduledWorkStatus) {
  return dueLabel(dueDate, status).startsWith("Overdue");
}

export const dateValue = (value?: string | null) => (value ? value.slice(0, 10) : "");
