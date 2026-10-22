"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { DiscoveryHeader, DiscoveryLoading, DiscoveryPagination } from "@/features/organizations";
import { QuestCard } from "@/features/quests/components/QuestCard";
import { EmptyState } from "@/design-system/patterns/MetricCard";
import { getQuests } from "@/data/api/quests";
import { toggleSavedOpportunity } from "@/data/api/organizations";
import type { Quest, QuestListResponse } from "@/types/quest";

export default function QuestsPage() { return <Suspense fallback={<DiscoveryLoading />}><QuestCatalogue /></Suspense>; }

function QuestCatalogue() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const search = params.get("search") ?? "";
  const difficulty = ["EASY", "MEDIUM", "HARD"].includes(params.get("difficulty") ?? "") ? params.get("difficulty")! : "";
  const status = ["available", "started", "completed", "saved", "archived"].includes(params.get("status") ?? "") ? params.get("status")! : "all";
  const rawPage = Number(params.get("page"));
  const page = Number.isInteger(rawPage) && rawPage > 0 && rawPage <= 10000 ? rawPage : 1;
  const [draft, setDraft] = useState(search);
  const [data, setData] = useState<QuestListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");
  const [revision, setRevision] = useState(0);
  function update(values: Record<string, string | number>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(values)) {
      if (value === "" || value === "all" || (key === "page" && value === 1)) next.delete(key); else next.set(key, String(value));
    }
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }
  useEffect(() => setDraft(search), [search]);
  useEffect(() => {
    if (draft === search) return;
    const timer = window.setTimeout(() => update({ search: draft, page: 1 }), 300);
    return () => window.clearTimeout(timer);
  }, [draft, search, params.toString()]);
  useEffect(() => {
    const request = new AbortController();
    setLoading(true); setError("");
    getQuests({ search, difficulty, status, page, limit: 12 }, request.signal)
      .then((result) => { if (!request.signal.aborted) setData(result); })
      .catch((err) => { if (!request.signal.aborted) { setData(null); setError(err.message ?? "Unable to load quests."); } })
      .finally(() => { if (!request.signal.aborted) setLoading(false); });
    return () => request.abort();
  }, [search, difficulty, status, page, revision]);
  async function save(quest: Quest) {
    setSaving(quest.id); setError("");
    try {
      const result = await toggleSavedOpportunity({ type: "QUEST", questId: quest.id });
      if (status === "saved" && !result.saved) setRevision((x) => x + 1);
      else setData((current) => current ? { ...current, items: current.items.map((item) => item.id === quest.id ? { ...item, isSaved: result.saved } : item) } : current);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save quest."); }
    finally { setSaving(""); }
  }
  return <div>
    <DiscoveryHeader title="Find your next contribution." description="Choose a real task. Make a plan. Keep your progress all the way through." action={<div className="flex flex-wrap gap-2"><Link href="/explore/quests/new" className="discovery-control border-moss/30">Publish a quest</Link><Link href="/schedule" className="discovery-control">Your scheduled work<ArrowRight size={15} /></Link></div>} />
    <div className="mb-6 space-y-4"><div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={17} className="pointer-events-none absolute left-3 top-3.5 text-muted" /><input aria-label="Search quests" className="discovery-input pl-10" placeholder="Search tasks, organizations, or repositories…" value={draft} maxLength={120} onChange={(event) => setDraft(event.target.value)} /></div><select aria-label="Quest difficulty" className="discovery-input sm:w-44" value={difficulty} onChange={(event) => update({ difficulty: event.target.value, page: 1 })}><option value="">Any difficulty</option><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option></select></div><div role="group" aria-label="Quest status" className="flex flex-wrap gap-2">{[["all", "All quests"], ["available", "Not started"], ["started", "In progress"], ["completed", "Completed"], ["saved", "Saved"], ["archived", "Your archived"]].map(([value, label]) => <button key={value} type="button" aria-pressed={status === value} onClick={() => update({ status: value, page: 1 })} className={`min-h-9 rounded-full border px-3.5 text-xs font-medium transition ${status === value ? "border-moss/40 bg-moss/15 text-moss" : "border-line text-muted hover:text-ink"}`}>{label}</button>)}</div></div>
    {error ? <div role="alert" className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-danger/30 p-4 text-sm text-danger">{error}<button type="button" className="discovery-control shrink-0" onClick={() => setRevision((x) => x + 1)}>Retry</button></div> : null}
    <p role="status" className="mb-4 font-mono text-xs text-muted">{loading ? "Finding contributions…" : data ? `${data.pagination.total} ${data.pagination.total === 1 ? "quest" : "quests"} · difficulty is set by the quest author` : "Results unavailable"}</p>
    {loading ? <DiscoveryLoading /> : data?.items.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.items.map((quest) => <QuestCard key={quest.id} quest={quest} onSave={() => save(quest)} saving={Boolean(saving)} />)}</div> : !error ? <EmptyState title={search || difficulty || status !== "all" ? "No quests match this view." : "Your next contribution starts here."} description={search || difficulty || status !== "all" ? "Try a different search or clear the filters to see more opportunities." : "When organizations publish quests, their tasks will appear here. You can explore organizations or plan your own contribution now."} action={<div className="flex flex-wrap justify-center gap-2"><button type="button" className="discovery-control" onClick={() => router.replace(pathname)}>Clear filters</button><Link href="/explore/organizations" className="discovery-control">Explore organizations</Link></div>} /> : null}
    {!loading && data ? <DiscoveryPagination {...data.pagination} onChange={(next) => update({ page: next })} /> : null}
  </div>;
}
