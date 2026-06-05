import clsx from "clsx";
import type { Priority } from "@/types/scheduledWork";

const styles = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-skyglass text-moss",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-red-100 text-red-700"
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={clsx("rounded px-2 py-1 text-xs font-bold", styles[priority])}>{priority}</span>;
}
