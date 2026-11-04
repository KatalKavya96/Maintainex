"use client";
import { useState } from "react";
import { AsyncState, Button, EmptyState, Feedback, PageHeader, Pagination, ViewSwitcher } from "@/design-system";
import { PinFilters } from "../components/PinFilters";
import { PinGrid } from "../components/PinGrid";
import { PinTable } from "../components/PinTable";
import { deletePin, getPins } from "@/data/api/pins";
import { useCollection } from "@/shared/hooks/useCollection";
import type { Pin } from "@/types/pin";

export default function PinsPage() {
  const collection = useCollection(getPins, { sort: "recent" });
  const [view, setView] = useState<"list" | "grid">("list");
  const [actionError, setActionError] = useState("");
  async function remove(pin: Pin) {
    if (!window.confirm(`Permanently delete "${pin.title}"? This cannot be undone.`)) return;
    try { await deletePin(pin.id); collection.reload(); }
    catch (reason) { setActionError(reason instanceof Error ? reason.message : "Unable to delete pin."); }
  }
  return <><PageHeader title="Pins" description="Useful references, ready for your next contribution session." action={<Button href="/pins/new">Add pin</Button>} />
    <PinFilters filters={collection.filters} onChange={collection.setFilters} />
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted">{collection.total} matching references</p><ViewSwitcher label="Pin layout" value={view} onChange={setView} options={[{value:"list",label:"List"},{value:"grid",label:"Grid"}]} /></div>
    {actionError && <Feedback message={actionError} />}
    <AsyncState state={collection.loading ? "loading" : collection.error ? "error" : "ready"} onRetry={collection.reload}>{!collection.items.length ? <EmptyState title="No references in this view" description="Try another filter or pin a useful contribution link." action={<Button href="/pins/new">Add pin</Button>} /> : view === "list" ? <PinTable pins={collection.items} /> : <PinGrid pins={collection.items} loading={false} error="" onChanged={collection.reload} onDelete={remove} />}</AsyncState>
    {!collection.error && <Pagination page={collection.page} total={collection.total} limit={collection.limit} onChange={collection.setPage} disabled={collection.loading} />}
  </>;
}
