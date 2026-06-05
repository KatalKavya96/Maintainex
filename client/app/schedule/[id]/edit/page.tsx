"use client";

import { useEffect, useState } from "react";
import { PageTitle } from "@/components/common/PageTitle";
import { ScheduledWorkForm } from "@/components/schedule/ScheduledWorkForm";
import { getScheduledWorkById } from "@/lib/api";
import type { ScheduledWork } from "@/types/scheduledWork";

export default function EditScheduledWorkPage({ params }: { params: { id: string } }) {
  const [work, setWork] = useState<ScheduledWork | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getScheduledWorkById(params.id).then(setWork).catch((err) => setError(err.message ?? "Scheduled work not found"));
  }, [params.id]);
  if (error) return <div className="rounded-md border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">{error}</div>;
  if (!work) return <div className="rounded-md border border-line bg-white p-5 text-sm text-slate-500 shadow-soft">Loading scheduled work...</div>;
  return (
    <>
      <PageTitle title="Edit Future Work" description="Update status, priority, timeline, notes, and blockers." />
      <ScheduledWorkForm work={work} />
    </>
  );
}
