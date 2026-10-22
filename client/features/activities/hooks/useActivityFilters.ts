"use client";
import { useMemo, useState } from "react";
import type { Activity } from "@/types/activity";

export type ActivityFilterState = { search: string; type: string; status: string; closingReason: string };
export const emptyActivityFilters: ActivityFilterState = { search:"", type:"", status:"", closingReason:"" };
export function filterActivityRows(rows: Activity[], filters: ActivityFilterState) {
  const query = filters.search.trim().toLowerCase();
  return rows.filter(row => (!query || [row.title,row.number,row.organizationName,row.repositoryName,...row.tags].join(" ").toLowerCase().includes(query))
    && (!filters.type || row.activityType === filters.type) && (!filters.status || row.status === filters.status)
    && (!filters.closingReason || row.closingReason === filters.closingReason));
}
export function useActivityFilters(rows: Activity[]) {
  const [filters,setFilters] = useState(emptyActivityFilters);
  const filtered = useMemo(() => filterActivityRows(rows,filters),[rows,filters]);
  return { filters, setFilters, filtered };
}
