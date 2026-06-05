"use client";

import Link from "next/link";
import type { ScheduledWork } from "@/types/scheduledWork";
import { DueStatusBadge } from "./DueStatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { WorkStatusBadge } from "./WorkStatusBadge";
import { assignedDuration } from "./scheduleUtils";
import { labelize } from "@/lib/constants";

export function ScheduledWorkTable({ items }: { items: ScheduledWork[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-soft">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-skyglass text-xs uppercase text-slate-500">
          <tr>
            {["Title", "Type", "Status", "Priority", "Repository", "Number", "Assigned For", "Due Status", "Actions"].map((head) => <th key={head} className="px-4 py-3 font-bold">{head}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3 font-semibold text-ink">{item.title}</td>
              <td className="px-4 py-3">{labelize(item.type)}</td>
              <td className="px-4 py-3"><WorkStatusBadge status={item.status} /></td>
              <td className="px-4 py-3"><PriorityBadge priority={item.priority} /></td>
              <td className="px-4 py-3">{item.organizationName}/{item.repositoryName}</td>
              <td className="px-4 py-3">{item.itemNumber ? `#${item.itemNumber}` : "-"}</td>
              <td className="px-4 py-3">{item.assignedToMe ? assignedDuration(item.assignedSince) : "-"}</td>
              <td className="px-4 py-3"><DueStatusBadge dueDate={item.dueDate} status={item.status} /></td>
              <td className="px-4 py-3"><Link href={`/schedule/${item.id}`} className="font-semibold text-moss">Open</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
