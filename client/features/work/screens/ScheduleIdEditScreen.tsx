"use client";

import { useEffect, useState } from "react";
import { PageTitle } from "@/design-system/patterns/PageTitle";
import { ScheduledWorkForm } from "@/features/work/components/ScheduledWorkForm";
import { getScheduledWorkById } from "@/data/api/work";
import type { ScheduledWork } from "@/types/scheduledWork";

export default function EditScheduledWorkPage({ params }: { params: { id: string } }) {
  const [work, setWork] = useState<ScheduledWork | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getScheduledWorkById(params.id).then(setWork).catch((err) => setError(err.message ?? "Scheduled work not found"));
  }, [params.id]);
  if (error) return <div className="rounded-xl border border-danger bg-skyglass p-5 text-sm font-semibold text-danger">{error}</div>;
  if (!work) return <div className="rounded-xl border border-line bg-panel p-5 text-sm text-muted shadow-soft">Loading scheduled work...</div>;
  return (
    <>
      <PageTitle title="Edit Future Work" description="Update status, priority, timeline, notes, and blockers." />
      <ScheduledWorkForm work={work} />
    </>
  );
}
