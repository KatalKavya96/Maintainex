"use client";

import { PinCard } from "@/features/pins/components/PinCard";
import type { Pin } from "@/types/pin";

export function PinGrid({ pins, loading, error, onChanged, onDelete }: { pins: Pin[]; loading: boolean; error?: string; onChanged: () => void; onDelete: (pin: Pin) => void }) {
  if (loading) return <div className="rounded-xl border border-line bg-panel p-8 text-sm text-muted shadow-soft">Loading pins...</div>;
  if (error) return <div className="rounded-xl border border-danger bg-skyglass p-8 text-sm font-semibold text-danger">{error}</div>;
  if (!pins.length) return <div className="rounded-xl border border-line bg-panel p-8 text-center text-sm text-muted shadow-soft">No pins yet. Add your first contribution shortcut.</div>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {pins.map((pin) => <PinCard key={pin.id} pin={pin} onChanged={onChanged} onDelete={onDelete} />)}
    </div>
  );
}
