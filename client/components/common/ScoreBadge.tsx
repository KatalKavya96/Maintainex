import { Info } from "lucide-react";

export function ScoreBadge({ score, label, compact = false }: { score: number; label?: string; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-0.5" : "space-y-1"}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
        Maintainex Score
        <Info size={12} />
      </div>
      <div className="flex items-end gap-2">
        <span className={compact ? "text-xl font-black text-moss" : "text-3xl font-black text-moss"}>{score || "--"}</span>
        {label ? <span className="mb-1 rounded bg-moss/10 px-1.5 py-0.5 text-[11px] font-extrabold text-moss">{label}</span> : null}
      </div>
    </div>
  );
}
