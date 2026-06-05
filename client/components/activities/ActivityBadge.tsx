import clsx from "clsx";
import { labelize } from "@/lib/constants";

const palette: Record<string, string> = {
  PR_REVIEWED: "bg-skyglass text-moss",
  PR_RAISED: "bg-emerald-50 text-emerald-700",
  ISSUE_RAISED: "bg-amber-50 text-amber-700",
  PR_CLOSED: "bg-rose-50 text-rose-700",
  ISSUE_CLOSED: "bg-purple-50 text-purple-700",
  MERGED: "bg-indigo-50 text-indigo-700",
  COMMENTED: "bg-cyan-50 text-cyan-700",
  OTHER: "bg-slate-100 text-slate-700"
};

export function ActivityBadge({ value }: { value: string }) {
  return (
    <span className={clsx("inline-flex rounded-md px-2.5 py-1 text-xs font-semibold", palette[value] ?? palette.OTHER)}>
      {labelize(value)}
    </span>
  );
}
