"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { labelize } from "@/lib/constants";
import { updateScheduledWorkStatus } from "@/lib/api";
import type { ScheduledWork, ScheduledWorkStatus } from "@/types/scheduledWork";
import { DueStatusBadge } from "./DueStatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { WorkStatusBadge } from "./WorkStatusBadge";
import { assignedDuration } from "./scheduleUtils";

export function ScheduledWorkCard({ item, onChanged, onDelete }: { item: ScheduledWork; onChanged: () => void; onDelete: (item: ScheduledWork) => void }) {
  const statusButton = async (status: ScheduledWorkStatus) => {
    await updateScheduledWorkStatus(item.id, status);
    onChanged();
  };
  return (
    <article className="rounded-xl border border-line bg-white p-4 shadow-soft transition hover:border-moss/25">
      <Link href={`/schedule/${item.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-bold text-ink">{item.title}</h3>
          <PriorityBadge priority={item.priority} />
        </div>
        <p className="mt-1 text-xs font-semibold text-slate-500">{item.organizationName}/{item.repositoryName}{item.itemNumber ? ` #${item.itemNumber}` : ""}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-skyglass px-2 py-1 text-xs font-bold text-moss">{labelize(item.type)}</span>
          <WorkStatusBadge status={item.status} />
          <DueStatusBadge dueDate={item.dueDate} status={item.status} />
        </div>
        {item.assignedToMe ? <p className="mt-3 text-xs font-semibold text-slate-500">{assignedDuration(item.assignedSince)}</p> : null}
        {item.tags.length ? <div className="mt-3 flex flex-wrap gap-1">{item.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{tag}</span>)}</div> : null}
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <div className="flex flex-wrap gap-1">
          {item.status !== "IN_PROGRESS" ? <button className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700" onClick={() => statusButton("IN_PROGRESS")}>Start</button> : null}
          {item.status !== "DONE" ? <button className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700" onClick={() => statusButton("DONE")}>Done</button> : null}
          {item.status !== "BLOCKED" ? <button className="rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-700" onClick={() => statusButton("BLOCKED")}>Block</button> : null}
        </div>
        <div className="flex gap-1">
          <Link href={`/schedule/${item.id}/edit`} className="rounded-lg p-2 text-slate-500 hover:bg-skyglass"><Pencil size={16} /></Link>
          <button className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" onClick={() => onDelete(item)}><Trash2 size={16} /></button>
        </div>
      </div>
    </article>
  );
}
