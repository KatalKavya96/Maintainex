"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AsyncState, Badge, EmptyState, Surface } from "@/design-system";
import { getScheduledWork } from "@/data/api/work";
import type { ScheduledWorkListResponse } from "@/types/scheduledWork";

const lanes = [{status:"IN_PROGRESS",label:"In progress"},{status:"BLOCKED",label:"Blocked"},{status:"PLANNED",label:"Up next"}] as const;
export function AttentionQueue() {
  const [groups, setGroups] = useState<ScheduledWorkListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const retry = useCallback(()=>setRevision(value=>value+1),[]);
  useEffect(()=>{
    let current = true;
    setLoading(true); setError(false);
    Promise.all(lanes.map(lane=>getScheduledWork({status:lane.status,limit:3})))
      .then(result=>{ if(current) setGroups(result); })
      .catch(()=>{ if(current) setError(true); })
      .finally(()=>{ if(current) setLoading(false); });
    return ()=>{current=false;};
  },[revision]);
  return <section className="mb-8"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-medium tracking-tight">Pick up your work</h2><p className="mt-1 text-xs text-muted">Up to three records per status. Counts include all matching work.</p></div><Link href="/schedule" className="text-sm text-moss">View all work →</Link></div><AsyncState state={loading ? "loading" : error ? "error" : "ready"} onRetry={retry}>{groups.some(group=>group.total > 0) && <div className="grid gap-4 lg:grid-cols-3">{lanes.map((lane,index)=><Surface key={lane.status}><div className="mb-5 flex items-center justify-between"><h3 className="text-sm font-medium">{lane.label}</h3><Badge>{groups[index]?.total ?? 0}</Badge></div><div className="divide-y divide-line">{groups[index]?.items.map(item=><Link key={item.id} href={`/schedule/${item.id}`} className="block py-4 first:pt-0"><p className="text-sm font-medium hover:text-moss">{item.title}</p><p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{lane.status === "BLOCKED" ? item.blockers || "Add blocker context to continue." : item.plan || `${item.organizationName}/${item.repositoryName}`}</p></Link>)}</div>{!groups[index]?.items.length && <p className="py-5 text-sm text-muted">No {lane.label.toLowerCase()} work.</p>}</Surface>)}</div>}{groups.length > 0 && groups.every(group=>!group.total) && <div className="mt-4"><EmptyState title="Start with one next action" description="Plan a contribution and keep its context ready for your next session." action={<Link href="/schedule/new" className="text-sm text-moss">Plan work →</Link>} /></div>}</AsyncState></section>;
}
