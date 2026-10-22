"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, GitBranch } from "lucide-react";
import { getQuests } from "@/data/api/quests";
import type { Quest } from "@/types/quest";

export function NextContribution() {
  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const request = new AbortController();
    setLoading(true); setError("");
    getQuests({ status: "started", limit: 1 }, request.signal).then((result) => { if (!request.signal.aborted) setQuest(result.items[0] ?? null); })
      .catch((err) => { if (!request.signal.aborted) setError(err.message ?? "Unable to load your next contribution."); })
      .finally(() => { if (!request.signal.aborted) setLoading(false); });
    return () => request.abort();
  }, [revision]);
  return <section className="mb-5 flex flex-wrap items-center justify-between gap-5 rounded-xl border border-moss/20 bg-moss/5 p-5 sm:p-6">
    <div className="min-w-0 max-w-2xl"><p className="mb-2 font-mono text-[10px] uppercase tracking-[.16em] text-moss">Your next contribution</p><h2 className="text-xl font-semibold tracking-tight">{loading ? "Picking up where you left off…" : error ? "Your progress is waiting." : quest ? quest.title : "One useful contribution starts a habit."}</h2><p className="mt-2 flex items-center gap-2 text-sm leading-6 text-muted">{quest && !error ? <GitBranch size={14} className="shrink-0" /> : null}{error || (quest ? `${quest.organization.name}${quest.repository ? `/${quest.repository.name}` : ""} · You’ve already started this quest.` : "Find a task that fits, start a plan, and keep your contribution moving.")}</p></div>
    {loading ? null : error ? <button type="button" className="discovery-control" onClick={() => setRevision((value) => value + 1)}>Retry</button> : <Link href={quest ? `/explore/quests/${quest.id}` : "/explore/quests"} className="inline-flex min-h-11 items-center gap-3 rounded-lg bg-moss px-4 text-sm font-semibold text-on-accent">{quest ? "Continue quest" : "Find a quest"}<ArrowRight size={16} /></Link>}
  </section>;
}
