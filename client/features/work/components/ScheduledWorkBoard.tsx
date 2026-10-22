"use client";

import { labelize, scheduledWorkStatuses } from "@/shared/lib/constants";
import type { ScheduledWork } from "@/types/scheduledWork";
import { ScheduledWorkCard } from "./ScheduledWorkCard";

export function ScheduledWorkBoard({ items, loading, error, onChanged, onDelete }: { items: ScheduledWork[]; loading: boolean; error?: string; onChanged: () => void; onDelete: (item: ScheduledWork) => void }) {
  if (loading) return <div className="rounded-xl border border-line bg-panel p-8 text-sm text-muted shadow-soft">Loading scheduled work...</div>;
  if (error) return <div className="rounded-xl border border-danger bg-skyglass p-8 text-sm font-semibold text-danger">{error}</div>;
  if (!items.length) return <div className="rounded-xl border border-line bg-panel p-8 text-center text-sm text-muted shadow-soft">No scheduled work yet.</div>;
  return (
    <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
      {scheduledWorkStatuses.map((status) => {
        const columnItems = items.filter((item) => item.status === status);
        return (
          <section key={status} className="rounded-xl border border-line bg-skyglass p-3">
            <h2 className="mb-3 text-sm font-bold text-muted">{labelize(status)} <span className="text-muted">({columnItems.length})</span></h2>
            <div className="space-y-3">
              {columnItems.map((item) => <ScheduledWorkCard key={item.id} item={item} onChanged={onChanged} onDelete={onDelete} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
