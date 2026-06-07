import { ArrowUpRight } from "lucide-react";

export function StatCard({ label, value }: { label: string; value: number }) {
  const accent = label.toLowerCase().includes("repo")
    ? "text-orange-400"
    : label.toLowerCase().includes("pr") || label.toLowerCase().includes("issue")
      ? "text-blue-400"
      : label.toLowerCase().includes("blocked") || label.toLowerCase().includes("overdue")
        ? "text-red-300"
        : "text-moss";

  return (
    <div className="metric-card min-w-0 rounded-xl border border-line bg-white p-3 shadow-soft sm:p-4">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold leading-5 text-slate-500 sm:text-sm">{label}</p>
          <p className={`mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl ${accent}`}>{value}</p>
          <p className="mt-1.5 truncate text-[11px] font-semibold text-slate-500 sm:text-xs">This workspace</p>
        </div>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-skyglass sm:h-9 sm:w-9 ${accent}`}>
          <ArrowUpRight size={15} />
        </span>
      </div>
    </div>
  );
}
