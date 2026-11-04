"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AsyncState, Badge, Button, Feedback, PageHeader, Surface } from "@/design-system";
import { getScheduledWorkById, deleteScheduledWork, markScheduledWorkDone, markScheduledWorkBlocked } from "@/data/api/work";
import { labelize } from "@/shared/lib/constants";
import { WorkStatusBadge } from "../components/WorkStatusBadge";
import { DueStatusBadge } from "../components/DueStatusBadge";
import type { ScheduledWork } from "@/types/scheduledWork";

export default function ScheduledWorkDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [work, setWork] = useState<ScheduledWork | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const load = () => {setLoading(true);setError("");return getScheduledWorkById(params.id).then(setWork).catch(()=>setError("Unable to load work.")).finally(()=>setLoading(false));};
  useEffect(()=>{void load();},[params.id]);
  async function change(action: () => Promise<unknown>) {
    if(pending)return;
    setPending(true);setError("");
    try {await action();} catch(reason) {setError(reason instanceof Error ? reason.message : "Unable to update work.");} finally {setPending(false);}
  }
  if(!work)return <AsyncState state={loading ? "loading" : "error"} onRetry={load} />;
  return <><PageHeader title={work.title} eyebrow="Work / contribution plan" description={`${work.organizationName}/${work.repositoryName}${work.itemNumber ? ` #${work.itemNumber}` : ""}`} action={<><Button variant="secondary" href={`/schedule/${work.id}/edit`}>Edit work</Button>{work.itemUrl && <Button href={work.itemUrl} target="_blank" rel="noopener noreferrer">Open source ↗</Button>}</>} />
    {error && <Feedback message={error} />}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]"><div className="space-y-5">{[{title:"Next action / plan",value:work.plan},{title:"Context",value:work.context},{title:"Blockers",value:work.blockers},{title:"Closing notes",value:work.closingNotes}].map(section=><Surface key={section.title}><h2 className="font-medium">{section.title}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">{section.value || "Not added yet. Use Edit work to capture this context."}</p></Surface>)}</div>
      <div className="space-y-5"><Surface><h2 className="mb-5 font-medium">Work details</h2><div className="flex flex-wrap gap-2"><WorkStatusBadge status={work.status} /><DueStatusBadge status={work.status} dueDate={work.dueDate} /></div><dl className="mt-6 space-y-4 text-sm">{[["Type",labelize(work.type)],["Priority",labelize(work.priority)],["Due",work.dueDate?.slice(0,10)],["Assigned to you",work.assignedToMe ? "Yes" : "No"],["Estimated hours",work.estimatedHours],["Actual hours",work.actualHours]].map(([label,value])=><div key={label} className="flex justify-between gap-4"><dt className="text-muted">{label}</dt><dd>{value ?? "—"}</dd></div>)}</dl><div className="mt-5 flex flex-wrap gap-2">{work.tags.map(tag=><Badge key={tag}>{tag}</Badge>)}</div></Surface>
        <Surface><h2 className="font-medium">Update progress</h2><p className="mt-2 text-xs leading-5 text-muted">Your work status is a personal record; it does not verify a GitHub merge.</p><div className="mt-4 flex flex-wrap gap-2"><Button disabled={pending || work.status === "DONE"} onClick={()=>change(async()=>setWork(await markScheduledWorkDone(work.id)))}>Mark done</Button><Button variant="secondary" disabled={pending || work.status === "BLOCKED"} onClick={()=>change(async()=>setWork(await markScheduledWorkBlocked(work.id)))}>Mark blocked</Button><Button variant="danger" disabled={pending} onClick={()=>{if(window.confirm(`Permanently delete "${work.title}"? This cannot be undone.`))void change(async()=>{await deleteScheduledWork(work.id);router.push("/schedule");});}}>Delete</Button></div></Surface></div></div>
  </>;
}
