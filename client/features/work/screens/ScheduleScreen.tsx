"use client";
import { useState } from "react";
import { AsyncState, Button, EmptyState, Feedback, PageHeader, Pagination, ViewSwitcher } from "@/design-system";
import { ScheduledWorkBoard } from "../components/ScheduledWorkBoard";
import { ScheduledWorkFilters } from "../components/ScheduledWorkFilters";
import { ScheduledWorkTable } from "../components/ScheduledWorkTable";
import { deleteScheduledWork, getScheduledWork } from "@/data/api/work";
import { useCollection } from "@/shared/hooks/useCollection";
import type { ScheduledWork } from "@/types/scheduledWork";

export default function SchedulePage() {
  const collection = useCollection(getScheduledWork);
  const [view, setView] = useState<"board" | "table">("table");
  const [actionError, setActionError] = useState("");
  async function remove(item: ScheduledWork) {
    if (!window.confirm(`Permanently delete "${item.title}"? This cannot be undone.`)) return;
    try { await deleteScheduledWork(item.id); collection.reload(); }
    catch (reason) { setActionError(reason instanceof Error ? reason.message : "Unable to delete work."); }
  }
  const state = collection.loading ? "loading" : collection.error ? "error" : "ready";
  return <><PageHeader title="Work" description="A clear next action for every contribution you plan." action={<Button href="/schedule/new">Plan work</Button>} />
    <ScheduledWorkFilters filters={collection.filters} onChange={collection.setFilters} />
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted">{collection.total} matching records · board shows the current page</p><ViewSwitcher label="Work layout" value={view} onChange={setView} options={[{value:"table",label:"List"},{value:"board",label:"Board"}]} /></div>
    {actionError && <Feedback message={actionError} />}
    <AsyncState state={state} onRetry={collection.reload}>{!collection.items.length ? <EmptyState title="No work in this view" description="Adjust the filters or plan your next contribution." action={<Button href="/schedule/new">Plan work</Button>} /> : view === "board" ? <ScheduledWorkBoard items={collection.items} loading={false} error="" onChanged={collection.reload} onDelete={remove} /> : <ScheduledWorkTable items={collection.items} />}</AsyncState>
    {!collection.error && <Pagination page={collection.page} total={collection.total} limit={collection.limit} onChange={collection.setPage} disabled={collection.loading} />}
  </>;
}
