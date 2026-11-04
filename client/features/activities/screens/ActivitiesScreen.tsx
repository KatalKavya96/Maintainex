"use client";
import { AsyncState, Button, PageHeader } from "@/design-system";
import { useActivityStore } from "@/state/activities";
import { ActivityFilters } from "../components/ActivityFilters";
import { ActivityTable } from "../components/ActivityTable";
import { useActivityFilters } from "../hooks/useActivityFilters";

export default function ActivitiesScreen() {
  const { activities, loading, error, total, reload } = useActivityStore();
  const { filters,setFilters,filtered } = useActivityFilters(activities);
  return <><PageHeader title="Activities" description="Your contribution records and supporting context." action={<Button href="/activities/new">Record activity</Button>} />
    <ActivityFilters filters={filters} onChange={setFilters} /><p role="status" className="mb-3 text-xs text-muted">{filtered.length} matching · {activities.length} loaded{total > activities.length ? ` of ${total} total (latest 1,000)` : ""}</p><AsyncState state={loading ? "loading" : error ? "error" : "ready"} onRetry={reload}><ActivityTable items={filtered} hasFilters={Object.values(filters).some(Boolean)} /></AsyncState>
  </>;
}
