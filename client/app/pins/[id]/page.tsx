"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { deletePin, getPinById, markPinOpened, toggleFavoritePin } from "@/lib/api";
import { labelize } from "@/lib/constants";
import type { Pin } from "@/types/pin";

export default function PinDetailPage({ params }: { params: { id: string } }) {
  const [pin, setPin] = useState<Pin | null>(null);
  const [error, setError] = useState("");
  const load = () => getPinById(params.id).then(setPin).catch((err) => setError(err.message ?? "Pin not found"));
  useEffect(() => { void load(); }, [params.id]);
  if (error) return <div className="rounded-md border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">{error}</div>;
  if (!pin) return <div className="rounded-md border border-line bg-white p-5 text-sm text-slate-500 shadow-soft">Loading pin...</div>;
  return (
    <>
      <PageTitle
        title={pin.title}
        description={pin.description || pin.url}
        action={<div className="flex gap-2"><Button href={`/pins/${pin.id}/edit`} variant="secondary">Edit</Button><Button type="button" onClick={async () => { await markPinOpened(pin.id); window.open(pin.url, "_blank", "noopener,noreferrer"); }}>Open</Button></div>}
      />
      <section className="rounded-md border border-line bg-white p-5 shadow-soft">
        <div className="flex items-center gap-4">
          <img src={pin.imageUrl || pin.faviconUrl || ""} alt="" className="h-16 w-16 rounded-md border border-line p-2 object-contain" />
          <div>
            <p className="font-semibold text-slate-500">{labelize(pin.category)}</p>
            <Link href={pin.url} target="_blank" className="break-all text-sm font-semibold text-moss">{pin.url}</Link>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">{pin.tags.map((tag) => <span key={tag} className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{tag}</span>)}</div>
        <div className="mt-6 flex gap-2 border-t border-line pt-4">
          <Button type="button" variant="secondary" onClick={async () => { await toggleFavoritePin(pin.id); await load(); }}>{pin.isFavorite ? "Unfavorite" : "Favorite"}</Button>
          <Button type="button" variant="ghost" onClick={async () => { if (window.confirm(`Delete "${pin.title}"?`)) { await deletePin(pin.id); window.location.href = "/pins"; } }}>Delete</Button>
        </div>
      </section>
    </>
  );
}
