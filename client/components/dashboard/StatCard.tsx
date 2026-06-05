import { ArrowUpRight } from "lucide-react";

export function StatCard({ label, value }: { label: string; value: number }) {
  const palette = label.toLowerCase().includes("repo")
    ? "from-orange-950/70 to-orange-900/40 border-orange-700/50 text-orange-400"
    : label.toLowerCase().includes("pr") || label.toLowerCase().includes("issue")
      ? "from-blue-950/70 to-blue-900/40 border-blue-700/50 text-blue-400"
      : label.toLowerCase().includes("blocked") || label.toLowerCase().includes("overdue")
        ? "from-red-950/60 to-red-900/30 border-red-700/40 text-red-300"
        : "from-green-950/70 to-green-900/35 border-green-700/50 text-moss";

  return (
    <div className={`metric-card relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-soft ${palette}`}>
      <div className="pointer-events-none absolute -right-12 top-5 h-44 w-44 rounded-full border-[28px] border-current opacity-10" />
      <div className="pointer-events-none absolute -right-4 top-16 h-28 w-28 rounded-full border-[20px] border-current opacity-10" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-black text-slate-400">{label}</p>
          <p className="mt-3 text-4xl font-black tracking-tight">{value}</p>
          <p className="mt-3 text-sm font-bold text-slate-500">This workspace</p>
        </div>
        <span className="grid h-14 w-14 place-items-center rounded-xl bg-current/15 text-current">
          <ArrowUpRight size={18} />
        </span>
      </div>
    </div>
  );
}
