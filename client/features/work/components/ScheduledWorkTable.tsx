"use client";
import Link from "next/link";
import { DataTable } from "@/design-system";
import type { ScheduledWork } from "@/types/scheduledWork";
import { DueStatusBadge } from "./DueStatusBadge";
import { WorkStatusBadge } from "./WorkStatusBadge";
import { labelize } from "@/shared/lib/constants";

export function ScheduledWorkTable({ items }: { items: ScheduledWork[] }) {
  return <DataTable label="Planned contribution work" rows={items} rowKey={item=>item.id} columns={[
    {id:"title",label:"Work / next action",render:item=><Link href={`/schedule/${item.id}`} className="block min-w-[220px] max-w-md"><span className="font-medium hover:text-moss">{item.title}</span><p className="mt-1 line-clamp-1 text-xs text-muted">{item.plan || labelize(item.type)}</p></Link>},
    {id:"repository",label:"Repository",render:item=><span className="text-xs text-muted">{item.organizationName}/{item.repositoryName}</span>},
    {id:"status",label:"Status",render:item=><WorkStatusBadge status={item.status} />},
    {id:"due",label:"Due",render:item=><DueStatusBadge dueDate={item.dueDate} status={item.status} />},
    {id:"priority",label:"Priority",render:item=><span className="text-xs text-muted">{labelize(item.priority)}</span>}
  ]} />;
}
