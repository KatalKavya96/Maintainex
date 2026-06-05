"use client";

import { labelize, priorities, scheduledWorkStatuses, scheduledWorkTypes } from "@/lib/constants";

export function ScheduledWorkFilters({ filters, onChange }: { filters: Record<string, string>; onChange: (filters: Record<string, string>) => void }) {
  const set = (key: string, value: string) => onChange({ ...filters, [key]: value });
  return (
    <div className="mb-5 grid gap-3 rounded-md border border-line bg-white p-4 shadow-soft lg:grid-cols-6">
      <input className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-moss" placeholder="Search work" value={filters.search ?? ""} onChange={(event) => set("search", event.target.value)} />
      <select className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-moss" value={filters.status ?? ""} onChange={(event) => set("status", event.target.value)}>
        <option value="">All statuses</option>
        {scheduledWorkStatuses.map((status) => <option key={status} value={status}>{labelize(status)}</option>)}
      </select>
      <select className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-moss" value={filters.type ?? ""} onChange={(event) => set("type", event.target.value)}>
        <option value="">All types</option>
        {scheduledWorkTypes.map((type) => <option key={type} value={type}>{labelize(type)}</option>)}
      </select>
      <select className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-moss" value={filters.priority ?? ""} onChange={(event) => set("priority", event.target.value)}>
        <option value="">All priorities</option>
        {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
      </select>
      <select className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-moss" value={filters.assignedToMe ?? ""} onChange={(event) => set("assignedToMe", event.target.value)}>
        <option value="">Assignment</option>
        <option value="true">Assigned to me</option>
        <option value="false">Not assigned</option>
      </select>
      <input className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-moss" placeholder="Repository" value={filters.repositoryName ?? ""} onChange={(event) => set("repositoryName", event.target.value)} />
    </div>
  );
}
