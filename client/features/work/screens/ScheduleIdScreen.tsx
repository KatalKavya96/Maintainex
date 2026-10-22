"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/design-system/patterns/Button";
import { PageTitle } from "@/design-system/patterns/PageTitle";
import { DueStatusBadge } from "@/features/work/components/DueStatusBadge";
import { PriorityBadge } from "@/features/work/components/PriorityBadge";
import { WorkStatusBadge } from "@/features/work/components/WorkStatusBadge";
import { assignedDuration, dateValue } from "@/features/work/components/scheduleUtils";
import { deleteScheduledWork, getScheduledWorkById, markScheduledWorkBlocked, markScheduledWorkDone } from "@/data/api/work";
import { labelize } from "@/shared/lib/constants";
import type { ScheduledWork } from "@/types/scheduledWork";

const row = (label: string, value: React.ReactNode) => (
  <div className="rounded-xl border border-line p-3">
    <p className="text-xs font-bold uppercase text-muted">{label}</p>
    <div className="mt-1 text-sm font-semibold text-muted">{value || "-"}</div>
  </div>
);

export default function ScheduledWorkDetailPage({ params }: { params: { id: string } }) {
  const [work, setWork] = useState<ScheduledWork | null>(null);
  const [error, setError] = useState("");
  const load = () => getScheduledWorkById(params.id).then(setWork).catch((err) => setError(err.message ?? "Scheduled work not found"));
  useEffect(() => { void load(); }, [params.id]);
  if (error) return <div className="rounded-xl border border-danger bg-skyglass p-5 text-sm font-semibold text-danger">{error}</div>;
  if (!work) return <div className="rounded-xl border border-line bg-panel p-5 text-sm text-muted shadow-soft">Loading scheduled work...</div>;
  return (
    <>
      <PageTitle
        title={work.title}
        description={`${work.organizationName}/${work.repositoryName}${work.itemNumber ? ` #${work.itemNumber}` : ""}`}
        action={<div className="flex flex-wrap gap-2"><Button href={`/schedule/${work.id}/edit`} variant="secondary">Edit</Button>{work.itemUrl ? <Link href={work.itemUrl} target="_blank" className="inline-flex h-10 items-center rounded-lg bg-moss px-4 text-sm font-semibold text-ink">Open GitHub Link</Link> : null}</div>}
      />
      <section className="rounded-xl border border-line bg-panel p-5 shadow-soft">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          {row("Type", labelize(work.type))}
          {row("Status", <WorkStatusBadge status={work.status} />)}
          {row("Priority", <PriorityBadge priority={work.priority} />)}
          {row("Due status", <DueStatusBadge dueDate={work.dueDate} status={work.status} />)}
          {row("Organization", work.organizationName)}
          {row("Repository", work.repositoryName)}
          {row("Number", work.itemNumber ? `#${work.itemNumber}` : "-")}
          {row("Assigned", work.assignedToMe ? "Yes" : "No")}
          {row("Assigned since", dateValue(work.assignedSince))}
          {row("Assigned duration", work.assignedToMe ? assignedDuration(work.assignedSince) : "-")}
          {row("Start date", dateValue(work.startDate))}
          {row("Due date", dateValue(work.dueDate))}
          {row("Completed at", dateValue(work.completedAt))}
          {row("Estimated hours", work.estimatedHours)}
          {row("Actual hours", work.actualHours)}
          {row("Difficulty", work.difficulty)}
          {row("Created", dateValue(work.createdAt))}
          {row("Last updated", dateValue(work.updatedAt))}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {row("Labels", work.labels.join(", "))}
          {row("Tags", work.tags.join(", "))}
          {row("Context", work.context)}
          {row("Plan", work.plan)}
          {row("Blockers", work.blockers)}
          {row("Closing notes", work.closingNotes)}
        </div>
        <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
          <Button href="/schedule" variant="secondary">Back to Schedule</Button>
          <Button type="button" onClick={async () => { await markScheduledWorkDone(work.id); await load(); }}>Mark Done</Button>
          <Button type="button" variant="secondary" onClick={async () => { await markScheduledWorkBlocked(work.id); await load(); }}>Mark Blocked</Button>
          <Button type="button" variant="ghost" onClick={async () => { if (window.confirm(`Delete "${work.title}"?`)) { await deleteScheduledWork(work.id); window.location.href = "/schedule"; } }}>Delete</Button>
        </div>
      </section>
    </>
  );
}
