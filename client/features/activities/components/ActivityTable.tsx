"use client";
import Link from "next/link";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { DataTable, EmptyState, Badge, type Column } from "@/design-system";
import { labelize } from "@/shared/lib/constants";
import { formatDate } from "@/shared/lib/dateUtils";
import { useActivityStore } from "@/state/activities";
import type { Activity } from "@/types/activity";
import { ActivityBadge } from "./ActivityBadge";

export function ActivityTable({ items, hasFilters = false }: { items: Activity[]; hasFilters?: boolean }) {
  const { deleteActivity } = useActivityStore();
  if (!items.length) return <EmptyState title={hasFilters ? "No matching activities" : "No activities yet"} description={hasFilters ? "Try another search or clear the filters." : "Record a contribution when you have work to track."} />;
  const columns: Column<Activity>[] = [
    { id:"contribution",label:"Contribution",render:row=><div className="min-w-48"><Link href={`/activities/${row.id}`} className="font-medium text-ink hover:text-moss">{row.title}</Link><p className="mt-1 text-xs text-muted">{row.organizationName}/{row.repositoryName}{row.number ? ` · #${row.number}` : ""}</p></div> },
    { id:"type",label:"Type",render:row=><ActivityBadge value={row.activityType} /> },
    { id:"status",label:"Status",render:row=><Badge tone={row.status === "MERGED" ? "accent" : "neutral"}>{labelize(row.status)}</Badge> },
    { id:"date",label:"Date",render:row=><span className="whitespace-nowrap text-muted">{formatDate(row.date)}</span> },
    { id:"source",label:"Source",render:row=><span className="text-muted">{row.source === "GITHUB_SYNC" ? "GitHub sync" : row.source === "IMPORTED" ? "Imported" : row.source === "MANUAL" ? "Manual entry" : "Not recorded"}</span> },
    { id:"actions",label:"Actions",render:row=><div className="flex items-center gap-1">
      <Link href={`/activities/${row.id}/edit`} aria-label={`Edit ${row.title}`} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-skyglass"><Pencil size={15} /></Link>
      {row.link ? <a href={row.link} target="_blank" rel="noreferrer" aria-label={`Open source for ${row.title}`} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-skyglass"><ExternalLink size={15} /></a> : null}
      <button type="button" aria-label={`Delete ${row.title}`} className="grid h-9 w-9 place-items-center rounded-lg text-danger hover:bg-skyglass" onClick={()=>{ if(window.confirm(`Permanently delete "${row.title}"? This cannot be undone.`)) void deleteActivity(row.id); }}><Trash2 size={15} /></button>
    </div> }
  ];
  return <DataTable label="Contribution activities" rows={items} columns={columns} rowKey={row=>row.id} />;
}
