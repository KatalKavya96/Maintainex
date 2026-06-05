import clsx from "clsx";
import { labelize } from "@/lib/constants";
import type { ScheduledWorkStatus } from "@/types/scheduledWork";

const styles = {
  PLANNED: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  BLOCKED: "bg-red-100 text-red-700",
  DONE: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-zinc-200 text-zinc-700",
  POSTPONED: "bg-amber-100 text-amber-700"
};

export function WorkStatusBadge({ status }: { status: ScheduledWorkStatus }) {
  return <span className={clsx("rounded px-2 py-1 text-xs font-bold", styles[status])}>{labelize(status)}</span>;
}
