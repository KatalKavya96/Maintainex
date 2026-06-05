import { ArrowUpRight } from "lucide-react";

export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-line bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-md bg-skyglass text-moss">
          <ArrowUpRight size={18} />
        </span>
      </div>
    </div>
  );
}
