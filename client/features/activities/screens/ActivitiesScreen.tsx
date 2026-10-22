"use client";
import { Button, PageHeader } from "@/design-system";
import { useActivityStore } from "@/state/activities";
import { ActivityFilters } from "../components/ActivityFilters";
import { ActivityTable } from "../components/ActivityTable";
import { useActivityFilters } from "../hooks/useActivityFilters";

export default function ActivitiesScreen() {
  const { activities } = useActivityStore();
  const { filters,setFilters,filtered } = useActivityFilters(activities);
  return <><PageHeader title="Activities" description="Your contribution records and supporting context." action={<Button href="/activities/new">Record activity</Button>} />
    <ActivityFilters filters={filters} onChange={setFilters} /><p role="status" className="mb-3 text-xs text-muted">{filtered.length} of {activities.length} activities</p><ActivityTable items={filtered} hasFilters={Object.values(filters).some(Boolean)} />
  </>;
}
