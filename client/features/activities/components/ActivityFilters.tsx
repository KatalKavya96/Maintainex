"use client";
import { Input, Select, Toolbar, Button } from "@/design-system";
import { activityTypes, closingReasons, labelize, statuses } from "@/shared/lib/constants";
import { emptyActivityFilters, type ActivityFilterState } from "../hooks/useActivityFilters";

export function ActivityFilters({ filters, onChange }: { filters: ActivityFilterState; onChange: (filters: ActivityFilterState) => void }) {
  const change = (key: keyof ActivityFilterState, value: string) => onChange({ ...filters,[key]:value });
  return <div className="mb-5"><Toolbar label="Filter activities">
    <Input aria-label="Search activities" placeholder="Search title, repository, number or tag" value={filters.search} onChange={e=>change("search",e.target.value)} className="sm:max-w-sm" />
    <Select aria-label="Activity type" value={filters.type} onChange={e=>change("type",e.target.value)} className="sm:w-auto"><option value="">All types</option>{activityTypes.map(value=><option key={value} value={value}>{labelize(value)}</option>)}</Select>
    <Select aria-label="Activity status" value={filters.status} onChange={e=>change("status",e.target.value)} className="sm:w-auto"><option value="">All statuses</option>{statuses.map(value=><option key={value} value={value}>{labelize(value)}</option>)}</Select>
    <Select aria-label="Closing reason" value={filters.closingReason} onChange={e=>change("closingReason",e.target.value)} className="sm:w-auto"><option value="">All closing reasons</option>{closingReasons.map(value=><option key={value} value={value}>{labelize(value)}</option>)}</Select>
    {Object.values(filters).some(Boolean) ? <Button variant="ghost" onClick={()=>onChange(emptyActivityFilters)}>Clear filters</Button> : null}
  </Toolbar></div>;
}
