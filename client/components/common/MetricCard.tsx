import type { ReactNode } from "react";
import clsx from "clsx";

export function MetricCard({ label, value, detail, icon, className }: { label: string; value: ReactNode; detail?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div className={clsx("metric-card rounded-lg border border-line bg-white p-4 shadow-soft", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-slate-400">{label}</p>
        {icon ? <span className="text-slate-500">{icon}</span> : null}
      </div>
      <div className="mt-3 text-2xl font-black text-ink">{value}</div>
      {detail ? <div className="mt-2 text-xs font-semibold text-slate-500">{detail}</div> : null}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-line bg-white p-8 text-center">
      <div>
        <p className="text-base font-extrabold text-ink">{title}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}
