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
    <div className="metric-card rounded-xl border border-line bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold leading-5 text-slate-500">{label}</p>
          <p className={`mt-2 text-3xl font-extrabold tracking-tight ${accent}`}>{value}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">This workspace</p>
        </div>
        <span className={`grid h-9 w-9 place-items-center rounded-lg bg-skyglass ${accent}`}>
          <ArrowUpRight size={15} />
        </span>
      </div>
    </div>
  );
}
