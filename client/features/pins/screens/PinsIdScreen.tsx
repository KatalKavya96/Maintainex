"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AsyncState, Badge, Button, Feedback, PageHeader, Surface } from "@/design-system";
import { deletePin, getPinById, markPinOpened, toggleFavoritePin } from "@/data/api/pins";
import { labelize } from "@/shared/lib/constants";
import type { Pin } from "@/types/pin";
import { webHref } from "@/shared/lib/webHref";

export default function PinDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [pin, setPin] = useState<Pin | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const load = () => { setLoading(true); setError(""); return getPinById(params.id).then(setPin).catch(()=>setError("Unable to load this pin.")).finally(()=>setLoading(false)); };
  useEffect(() => { void load(); }, [params.id]);
  async function act(action: () => Promise<unknown>) {
    if (pending) return;
    setPending(true); setError("");
    try { await action(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update pin."); }
    finally { setPending(false); }
  }
  if (!pin) return <AsyncState state={loading ? "loading" : "error"} onRetry={load} />;
  return <><PageHeader title={pin.title} eyebrow="Pins / reference" description={pin.description || "A reference for your contribution work."} action={<><Button href={`/pins/${pin.id}/edit`} variant="secondary">Edit pin</Button><Button href={webHref(pin.url) ?? "#"} target="_blank" rel="noopener noreferrer" onClick={()=>{ void markPinOpened(pin.id).catch(()=>setError("Link opened, but its last-opened time could not be saved.")); }}>Open reference ↗</Button></>} />
    {error && <Feedback message={error} />}
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]"><Surface><h2 className="text-base font-medium">Source</h2><a href={webHref(pin.url)} target="_blank" rel="noopener noreferrer" className="mt-3 block break-all text-sm leading-6 text-moss">{pin.url}</a><div className="mt-6 flex flex-wrap gap-2"><Badge>{labelize(pin.category)}</Badge>{pin.tags.map(tag=><Badge key={tag}>{tag}</Badge>)}</div><div className="mt-8 border-t border-line pt-5"><h2 className="font-medium">Context</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">{pin.description || "Add a description to remember why this reference matters."}</p></div></Surface>
      <Surface><h2 className="font-medium">Turn context into progress</h2><p className="mt-3 text-sm leading-6 text-muted">Start a work item with this reference. Review the details before saving.</p><Button href={`/schedule/new?pinId=${encodeURIComponent(pin.id)}`} className="mt-5">Plan work from pin</Button><div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5"><Button variant="secondary" disabled={pending} onClick={()=>act(async()=>{const updated=await toggleFavoritePin(pin.id); setPin(updated);})}>{pin.isFavorite ? "Remove favorite" : "Favorite"}</Button><Button variant="danger" disabled={pending} onClick={()=>{if(window.confirm(`Permanently delete "${pin.title}"? This cannot be undone.`)) void act(async()=>{await deletePin(pin.id);router.push("/pins");});}}>Delete</Button></div></Surface></div>
  </>;
}
