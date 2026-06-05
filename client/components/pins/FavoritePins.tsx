"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPins } from "@/lib/api";
import type { Pin } from "@/types/pin";

export function FavoritePins() {
  const [pins, setPins] = useState<Pin[]>([]);
  useEffect(() => {
    getPins({ favorite: true, limit: 8 }).then((data) => setPins(data.items)).catch(() => setPins([]));
  }, []);
  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold">Quick Pins</h2>
        <Link href="/pins" className="text-sm font-semibold text-moss">View all pins</Link>
      </div>
      {pins.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {pins.map((pin) => (
            <a key={pin.id} href={pin.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-line p-3 text-sm font-semibold transition hover:bg-skyglass">
              <img src={pin.imageUrl || pin.faviconUrl || ""} alt="" className="h-6 w-6 rounded object-contain" />
              <span className="truncate">{pin.title}</span>
            </a>
          ))}
        </div>
      ) : <p className="text-sm text-slate-500">Favorite pins will appear here.</p>}
    </section>
  );
}
