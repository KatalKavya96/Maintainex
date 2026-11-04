"use client";
import { Input, Select } from "@/design-system";

import { labelize, priorities, scheduledWorkStatuses, scheduledWorkTypes } from "@/shared/lib/constants";

export function ScheduledWorkFilters({ filters, onChange }: { filters: Record<string, string>; onChange: (filters: Record<string, string>) => void }) {
  const set = (key: string, value: string) => onChange({ ...filters, [key]: value });
  return (
    <div className="mb-5 grid gap-3 rounded-xl border border-line bg-panel p-4 shadow-soft lg:grid-cols-6">
      <Input aria-label="Search work" placeholder="Search work" value={filters.search ?? ""} onChange={(event) => set("search", event.target.value)} />
      <Select aria-label="Work status" value={filters.status ?? ""} onChange={(event) => set("status", event.target.value)}>
        <option value="">All statuses</option>
        {scheduledWorkStatuses.map((status) => <option key={status} value={status}>{labelize(status)}</option>)}
      </Select>
      <Select aria-label="Work type" value={filters.type ?? ""} onChange={(event) => set("type", event.target.value)}>
        <option value="">All types</option>
        {scheduledWorkTypes.map((type) => <option key={type} value={type}>{labelize(type)}</option>)}
      </Select>
      <Select aria-label="Work priority" value={filters.priority ?? ""} onChange={(event) => set("priority", event.target.value)}>
        <option value="">All priorities</option>
        {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
      </Select>
      <Select aria-label="Assignment" value={filters.assignedToMe ?? ""} onChange={(event) => set("assignedToMe", event.target.value)}>
        <option value="">Assignment</option>
        <option value="true">Assigned to me</option>
        <option value="false">Not assigned</option>
      </Select>
      <Input aria-label="Repository" placeholder="Repository" value={filters.repositoryName ?? ""} onChange={(event) => set("repositoryName", event.target.value)} />
    </div>
  );
}
