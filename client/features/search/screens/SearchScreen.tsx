"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Search } from "lucide-react";
import { DiscoveryHeader, DiscoveryLoading } from "@/features/organizations";
import { EmptyState } from "@/design-system/patterns/MetricCard";
import { searchWorkspace } from "@/data/api/search";
import { availableSearchKinds, searchLabels, type SearchKind, type SearchResponse } from "@/types/search";

export default function SearchPage() { return <Suspense fallback={<DiscoveryLoading />}><WorkspaceSearch /></Suspense>; }

function WorkspaceSearch() {
  const params = useSearchParams();
  const router = useRouter();
  const query = params.get("q") ?? "";
  const kind = availableSearchKinds.some((value) => value === params.get("kind")) ? params.get("kind") as SearchKind : "all";
  const [draft, setDraft] = useState(query);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => setDraft(query), [query]);
  useEffect(() => {
    const request = new AbortController();
    setError(""); setData(null);
    if (query.trim().length < 2) { setLoading(false); return; }
    setLoading(true);
    searchWorkspace(query.trim(), kind, kind === "all" ? 6 : 30, request.signal)
      .then((next) => { if (!request.signal.aborted) setData(next); })
      .catch((err) => { if (!request.signal.aborted) setError(err.message ?? "Search unavailable."); })
      .finally(() => { if (!request.signal.aborted) setLoading(false); });
    return () => request.abort();
  }, [query, kind, revision]);
  function navigate(nextKind: string, q = query) { router.replace(`/search?q=${encodeURIComponent(q.trim())}${nextKind !== "all" ? `&kind=${nextKind}` : ""}`); }
  const total = data ? Object.values(data.counts).reduce((sum, n) => sum + n, 0) : 0;
  return <div>
    <DiscoveryHeader eyebrow="Search Maintainex" title="Find your way forward." description="Search the contribution catalogue, discover people, and pick up your own work." />
    <form className="mb-5 flex gap-2" role="search" onSubmit={(event) => { event.preventDefault(); navigate(kind, draft); }}><div className="relative flex-1"><Search size={17} className="pointer-events-none absolute left-3 top-3.5 text-muted" /><input className="discovery-input pl-10" aria-label="Search query" placeholder="A task, a repository, a person…" maxLength={120} value={draft} onChange={(event) => setDraft(event.target.value)} /></div><button type="submit" className="discovery-control border-moss/40" disabled={draft.trim().length < 2}>Search</button></form>
    <div role="group" aria-label="Result types" className="mb-6 flex flex-wrap gap-2">{["all", ...availableSearchKinds].map((value) => <button key={value} type="button" aria-pressed={kind === value} onClick={() => navigate(value)} className={`min-h-9 rounded-full border px-3 text-xs ${kind === value ? "border-moss/40 bg-moss/10 text-moss" : "border-line text-muted"}`}>{value === "all" ? "All" : searchLabels[value as SearchKind]}{data ? <span className="ml-2 font-mono">{value === "all" ? total : data.counts[value as SearchKind]}</span> : null}</button>)}</div>
    {error ? <div role="alert" className="discovery-panel text-sm text-danger">{error}<button type="button" className="discovery-control ml-4" onClick={() => setRevision((x) => x + 1)}>Retry</button></div> : loading ? <DiscoveryLoading /> : !data || !data.items.length ? <EmptyState title={query.trim().length < 2 ? "What are you looking for?" : "No matches found."} description={query.trim().length < 2 ? "Enter at least two characters. Your work and pins are visible only to you." : "Try a shorter search, another keyword, or a different result type."} /> : <div className="space-y-7">
      {availableSearchKinds.filter((group) => kind === "all" || kind === group).map((group) => {
        const items = data.items.filter((item) => item.kind === group);
        if (!items.length) return null;
        return <section key={group}><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">{searchLabels[group]} <span className="ml-2 font-mono text-xs text-muted">{data.counts[group]}</span></h2>{data.counts[group] > items.length ? kind === "all" ? <button type="button" onClick={() => navigate(group)} className="text-xs text-moss">View more →</button> : <span className="text-xs text-muted">First {items.length} shown · refine your search for more</span> : null}</div><div className="overflow-hidden rounded-xl border border-line bg-[var(--app-panel)]">{items.map((item) => <Link key={item.id} href={item.href} className="flex items-center justify-between gap-4 border-b border-line p-4 last:border-0 hover:bg-moss/5"><span className="min-w-0"><span className="block truncate text-sm font-medium">{item.title}</span><span className="mt-1 block truncate text-xs text-muted">{item.subtitle}</span></span><ArrowUpRight size={16} className="shrink-0 text-moss" /></Link>)}</div></section>;
      })}
    </div>}
  </div>;
}
