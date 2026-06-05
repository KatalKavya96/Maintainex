"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getScheduledWork } from "@/lib/api";
import type { ScheduledWork } from "@/types/scheduledWork";
import { DueStatusBadge } from "./DueStatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { assignedDuration } from "./scheduleUtils";

export function UpcomingWork() {
  const [items, setItems] = useState<ScheduledWork[]>([]);
  useEffect(() => {
    getScheduledWork({ limit: 5 }).then((data) => setItems(data.items)).catch(() => setItems([]));
  }, []);
  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold">Upcoming Work</h2>
        <Link href="/schedule" className="text-sm font-semibold text-moss">View schedule</Link>
      </div>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <Link key={item.id} href={`/schedule/${item.id}`} className="block rounded-xl border border-line p-3 transition hover:bg-skyglass">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-ink">{item.title}</p>
                <PriorityBadge priority={item.priority} />
              </div>
              <p className="mt-1 text-sm text-slate-500">{item.repositoryName}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <DueStatusBadge dueDate={item.dueDate} status={item.status} />
                {item.assignedToMe ? <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{assignedDuration(item.assignedSince)}</span> : null}
              </div>
            </Link>
          ))}
        </div>
      ) : <p className="text-sm text-slate-500">Scheduled work will appear here.</p>}
    </section>
  );
}
