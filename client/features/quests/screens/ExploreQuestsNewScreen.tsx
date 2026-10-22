"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DiscoveryHeader } from "@/features/organizations";
import { createQuest, getQuestAuthoringOptions } from "@/data/api/quests";
import { useAuthStore } from "@/state/auth";
import type { CreateQuestInput, QuestAuthoringOptions } from "@/types/quest";

const contributionTypes: Record<string, string> = { DOCUMENTATION: "Documentation", BUG_FIX: "Bug fix", TESTING: "Tests", FEATURE_BUILD: "Feature", ISSUE_WORK: "Issue work" };

export default function NewQuestPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [options, setOptions] = useState<QuestAuthoringOptions>([]);
  const [form, setForm] = useState<CreateQuestInput>({ organizationId: "", repositoryId: "", title: "", description: "", acceptanceCriteria: "", sourceUrl: "", type: "DOCUMENTATION", difficulty: "EASY" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    getQuestAuthoringOptions().then((items) => { if (active) setOptions(items); }).catch((err) => { if (active) setError(err.message ?? "Unable to load projects."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  const org = options.find((item) => item.id === form.organizationId);
  return <div className="mx-auto max-w-3xl">
    <Link href="/explore/quests" className="mb-6 inline-block text-sm text-muted hover:text-moss">← All quests</Link>
    <DiscoveryHeader title="Make room for a contribution." description="Publish a clear task from one of your tracked projects. Include a real source and tell contributors what a useful outcome looks like." />
    {error ? <div role="alert" className="discovery-panel mb-4 text-sm text-danger">{error}{!saving ? <button type="button" className="discovery-control ml-3" onClick={() => setRevision((x) => x + 1)}>Retry</button> : null}</div> : null}
    {user?.id === "viewer" ? <Link href="/login" className="discovery-control">Sign in to publish a quest</Link> : loading ? <p role="status">Loading your tracked projects…</p> : !options.length ? <section className="discovery-panel"><h2 className="text-lg font-semibold">Connect a project first.</h2><p className="mt-2 text-sm leading-6 text-muted">You can publish quests for organizations in your workspace. Connect and sync GitHub to bring your projects into Maintainex.</p><Link href="/settings" className="discovery-control mt-5">Connect GitHub</Link></section> : <form className="discovery-panel space-y-5" onSubmit={async (event) => {
      event.preventDefault(); setSaving(true); setError("");
      try { const quest = await createQuest({ ...form, repositoryId: form.repositoryId || null }); router.push(`/explore/quests/${quest.id}`); }
      catch (err) { setError(err instanceof Error ? err.message : "Unable to publish quest."); setSaving(false); }
    }}>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Organization<select required className="discovery-input mt-2" value={form.organizationId} onChange={(event) => setForm({ ...form, organizationId: event.target.value, repositoryId: "" })}><option value="">Choose a tracked organization</option>{options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-sm">Repository<select className="discovery-input mt-2" value={form.repositoryId ?? ""} disabled={!org} onChange={(event) => setForm({ ...form, repositoryId: event.target.value })}><option value="">Organization-wide task</option>{org?.repositories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
      <label className="block text-sm">Task title<input required minLength={3} maxLength={200} className="discovery-input mt-2" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="A specific, actionable task" /></label>
      <label className="block text-sm">Source link<input required type="url" maxLength={2048} className="discovery-input mt-2" value={form.sourceUrl} onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })} placeholder="https://github.com/owner/repo/issues/123" /></label>
      <label className="block text-sm">The brief<textarea required minLength={10} maxLength={20000} className="discovery-input mt-2 min-h-36 py-3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the problem, context, and prerequisites." /></label>
      <label className="block text-sm">Acceptance criteria<textarea required minLength={5} maxLength={10000} className="discovery-input mt-2 min-h-28 py-3" value={form.acceptanceCriteria} onChange={(event) => setForm({ ...form, acceptanceCriteria: event.target.value })} placeholder="How can a contributor check that the task is finished?" /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Contribution type<select className="discovery-input mt-2" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{Object.entries(contributionTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm">Difficulty estimate<select className="discovery-input mt-2" value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>{["EASY", "MEDIUM", "HARD"].map((value) => <option key={value} value={value}>{value[0] + value.slice(1).toLowerCase()}</option>)}</select></label></div>
      <p className="text-xs leading-5 text-muted">Published quests are visible in Maintainex’s contribution catalogue. This does not create or modify an issue on GitHub.</p>
      <button type="submit" disabled={saving} className="discovery-control border-moss/40 text-moss">{saving ? "Publishing…" : "Publish quest"}</button>
    </form>}
  </div>;
}
