"use client";

import { PinCard } from "@/components/pins/PinCard";
import type { Pin } from "@/types/pin";

export function PinGrid({ pins, loading, error, onChanged, onDelete }: { pins: Pin[]; loading: boolean; error?: string; onChanged: () => void; onDelete: (pin: Pin) => void }) {
  if (loading) return <div className="rounded-md border border-line bg-white p-8 text-sm text-slate-500 shadow-soft">Loading pins...</div>;
  if (error) return <div className="rounded-md border border-red-200 bg-red-50 p-8 text-sm font-semibold text-red-700">{error}</div>;
  if (!pins.length) return <div className="rounded-md border border-line bg-white p-8 text-center text-sm text-slate-500 shadow-soft">No pins yet. Add your first contribution shortcut.</div>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {pins.map((pin) => <PinCard key={pin.id} pin={pin} onChanged={onChanged} onDelete={onDelete} />)}
    </div>
  );
}
