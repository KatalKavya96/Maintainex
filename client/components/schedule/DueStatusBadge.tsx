import clsx from "clsx";
import type { ScheduledWorkStatus } from "@/types/scheduledWork";
import { dueStatus, isOverdue } from "./scheduleUtils";

export function DueStatusBadge({ dueDate, status }: { dueDate?: string | null; status: ScheduledWorkStatus }) {
  const value = dueStatus(dueDate, status);
  return <span className={clsx("rounded px-2 py-1 text-xs font-bold", isOverdue(dueDate, status) ? "bg-red-100 text-red-700" : status === "DONE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600")}>{value}</span>;
}
