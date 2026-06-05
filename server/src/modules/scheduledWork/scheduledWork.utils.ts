import type { ScheduledWorkStatus } from "@prisma/client";

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export function getAssignedDuration(assignedSince?: Date | null) {
  if (!assignedSince) return 0;
  const diff = startOfDay(new Date()).getTime() - startOfDay(new Date(assignedSince)).getTime();
  return Math.max(Math.floor(diff / 86400000), 0);
}

export function isOverdue(dueDate?: Date | null, status?: ScheduledWorkStatus) {
  if (!dueDate || status === "DONE") return false;
  return startOfDay(new Date(dueDate)).getTime() < startOfDay(new Date()).getTime();
}

export function getDueStatus(dueDate?: Date | null, status?: ScheduledWorkStatus) {
  if (status === "DONE") return "Completed";
  if (!dueDate) return "No due date";
  const diff = Math.floor((startOfDay(new Date(dueDate)).getTime() - startOfDay(new Date()).getTime()) / 86400000);
  if (diff === 0) return "Due today";
  if (diff > 0) return `Due in ${diff} day${diff === 1 ? "" : "s"}`;
  return `Overdue by ${Math.abs(diff)} day${diff === -1 ? "" : "s"}`;
}
