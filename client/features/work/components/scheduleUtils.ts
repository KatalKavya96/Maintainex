import type { ScheduledWorkStatus } from "@/types/scheduledWork";

const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());

export function assignedDuration(assignedSince?: string | null) {
  if (!assignedSince) return "";
  const days = Math.max(Math.floor((startOfDay(new Date()).getTime() - startOfDay(new Date(assignedSince)).getTime()) / 86400000), 0);
  return `Assigned for ${days} day${days === 1 ? "" : "s"}`;
}

export function dueStatus(dueDate?: string | null, status?: ScheduledWorkStatus) {
  if (status === "DONE") return "Completed";
  if (!dueDate) return "No due date";
  const days = Math.floor((startOfDay(new Date(dueDate)).getTime() - startOfDay(new Date()).getTime()) / 86400000);
  if (days === 0) return "Due today";
  if (days > 0) return `Due in ${days} day${days === 1 ? "" : "s"}`;
  return `Overdue by ${Math.abs(days)} day${days === -1 ? "" : "s"}`;
}

export function isOverdue(dueDate?: string | null, status?: ScheduledWorkStatus) {
  return dueStatus(dueDate, status).startsWith("Overdue");
}

export const dateValue = (value?: string | null) => (value ? value.slice(0, 10) : "");
