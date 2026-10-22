"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/design-system/patterns/Button";
import { PageTitle } from "@/design-system/patterns/PageTitle";
import { PinFilters } from "@/features/pins/components/PinFilters";
import { PinGrid } from "@/features/pins/components/PinGrid";
import { deletePin, getPins } from "@/data/api/pins";
import type { Pin } from "@/types/pin";

export default function PinsPage() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({ sort: "recent" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPins = useCallback(() => {
    setLoading(true);
    getPins({ ...filters, limit: 100 })
      .then((data) => {
        setPins(data.items);
        setError("");
      })
      .catch((err) => setError(err.message ?? "Failed to load pins"))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => loadPins(), [loadPins]);

  async function remove(pin: Pin) {
    if (!window.confirm(`Delete "${pin.title}"?`)) return;
    await deletePin(pin.id);
    loadPins();
  }

  return (
    <>
      <PageTitle
        title="Pinned Contribution Links"
        description="Quick links for repositories, issues, PRs, docs, boards, and contribution websites."
        action={<Button href="/pins/new">Add Pin</Button>}
      />
      <PinFilters filters={filters} onChange={setFilters} />
      <PinGrid pins={pins} loading={loading} error={error} onChanged={loadPins} onDelete={remove} />
    </>
  );
}
