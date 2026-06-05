"use client";

import { labelize, scheduledWorkStatuses } from "@/lib/constants";
import type { ScheduledWork } from "@/types/scheduledWork";
import { ScheduledWorkCard } from "./ScheduledWorkCard";

export function ScheduledWorkBoard({ items, loading, error, onChanged, onDelete }: { items: ScheduledWork[]; loading: boolean; error?: string; onChanged: () => void; onDelete: (item: ScheduledWork) => void }) {
  if (loading) return <div className="rounded-xl border border-line bg-white p-8 text-sm text-slate-500 shadow-soft">Loading scheduled work...</div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm font-semibold text-red-700">{error}</div>;
  if (!items.length) return <div className="rounded-xl border border-line bg-white p-8 text-center text-sm text-slate-500 shadow-soft">No scheduled work yet.</div>;
  return (
    <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
      {scheduledWorkStatuses.map((status) => {
        const columnItems = items.filter((item) => item.status === status);
        return (
          <section key={status} className="rounded-xl border border-line bg-skyglass p-3">
            <h2 className="mb-3 text-sm font-bold text-slate-700">{labelize(status)} <span className="text-slate-400">({columnItems.length})</span></h2>
            <div className="space-y-3">
              {columnItems.map((item) => <ScheduledWorkCard key={item.id} item={item} onChanged={onChanged} onDelete={onDelete} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
