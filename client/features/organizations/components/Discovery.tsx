import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Compass } from "lucide-react";

export function DiscoveryHeader({ title, description, action, eyebrow = "Start contributing" }: { title: string; description: string; action?: ReactNode; eyebrow?: string }) {
  return <header className="mb-7 flex flex-wrap items-end justify-between gap-5 border-b border-line pb-7"><div className="max-w-2xl"><p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[.18em] text-moss"><Compass size={14} />{eyebrow}</p><h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1><p className="mt-3 text-sm leading-6 text-muted sm:text-base">{description}</p></div>{action}</header>;
}
export function DiscoveryPagination({ page, totalPages, total, onChange }: { page: number; totalPages: number; total: number; onChange: (page: number) => void }) {
  if (!total) return null;
  return <nav aria-label="Results pagination" className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5"><p className="text-sm text-muted">Page <span className="font-mono text-ink">{page}</span> of {totalPages} · {total.toLocaleString()} {total === 1 ? "result" : "results"}</p><div className="flex gap-2"><button type="button" className="discovery-control" disabled={page <= 1} onClick={() => onChange(page - 1)}><ArrowLeft size={15} />Previous</button><button type="button" className="discovery-control" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next<ArrowRight size={15} /></button></div></nav>;
}
export function DiscoveryLoading() {
  return <div role="status" aria-label="Loading results" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((n) => <div key={n} className="h-56 animate-pulse rounded-xl border border-line bg-[var(--app-panel)] p-5"><div className="h-3 w-20 rounded bg-[var(--app-elevated)]" /><div className="mt-6 h-5 w-3/4 rounded bg-[var(--app-elevated)]" /><div className="mt-4 h-16 rounded bg-[var(--app-elevated)]" /></div>)}</div>;
}
