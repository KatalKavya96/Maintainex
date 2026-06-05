"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { ScheduledWorkBoard } from "@/components/schedule/ScheduledWorkBoard";
import { ScheduledWorkFilters } from "@/components/schedule/ScheduledWorkFilters";
import { ScheduledWorkTable } from "@/components/schedule/ScheduledWorkTable";
import { deleteScheduledWork, getScheduledWork } from "@/lib/api";
import type { ScheduledWork } from "@/types/scheduledWork";

export default function SchedulePage() {
  const [items, setItems] = useState<ScheduledWork[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState<"board" | "table">("board");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setLoading(true);
    getScheduledWork({ ...filters, limit: 100 })
      .then((data) => { setItems(data.items); setError(""); })
      .catch((err) => setError(err.message ?? "Failed to load scheduled work"))
      .finally(() => setLoading(false));
  }, [filters]);
  useEffect(() => load(), [load]);
  async function remove(item: ScheduledWork) {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    await deleteScheduledWork(item.id);
    load();
  }
  return (
    <>
      <PageTitle title="Future Work Scheduler" description="Plan PR reviews, issues, and future contribution work." action={<Button href="/schedule/new">Add Work</Button>} />
      <ScheduledWorkFilters filters={filters} onChange={setFilters} />
      <div className="mb-4 flex justify-end gap-2">
        <Button type="button" variant={view === "board" ? "primary" : "secondary"} onClick={() => setView("board")}>Board</Button>
        <Button type="button" variant={view === "table" ? "primary" : "secondary"} onClick={() => setView("table")}>Table</Button>
      </div>
      {view === "board" ? <ScheduledWorkBoard items={items} loading={loading} error={error} onChanged={load} onDelete={remove} /> : <ScheduledWorkTable items={items} />}
    </>
  );
}
