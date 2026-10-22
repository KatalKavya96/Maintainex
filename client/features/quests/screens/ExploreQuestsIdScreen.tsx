"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, CheckCircle2, ExternalLink, GitBranch, Loader2 } from "lucide-react";
import { DiscoveryHeader } from "@/features/organizations";
import { archiveQuest, restoreQuest, getQuest, startQuest, updateQuestProgress } from "@/data/api/quests";
import { toggleSavedOpportunity } from "@/data/api/organizations";
import { updateScheduledWork, markScheduledWorkBlocked } from "@/data/api/work";
import { useAuthStore } from "@/state/auth";
import type { Quest, QuestProgressStatus } from "@/types/quest";

export default function QuestDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuthStore();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [section, setSection] = useState("brief");
  const [plan, setPlan] = useState("");
  const [blockers, setBlockers] = useState("");
  const [evidence, setEvidence] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const request = new AbortController();
    setError(""); setQuest(null);
    getQuest(params.id, request.signal).then((data) => {
      if (request.signal.aborted) return;
      setQuest(data);
      setPlan(data.progress?.work?.plan ?? "");
      setBlockers(data.progress?.work?.blockers ?? "");
      setEvidence(data.progress?.evidenceUrl ?? "");
      setNote(data.progress?.completionNote ?? "");
    }).catch((err) => { if (!request.signal.aborted) setError(err.message ?? "Unable to load quest."); });
    return () => request.abort();
  }, [params.id, revision]);

  async function perform(label: string, action: () => Promise<void>) {
    setBusy(label); setError(""); setMessage("");
    try { await action(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to save changes."); }
    finally { setBusy(""); }
  }
  async function begin() {
    await perform("start", async () => {
      const next = await startQuest(params.id);
      setQuest(next); setPlan(next.progress?.work?.plan ?? ""); setBlockers(next.progress?.work?.blockers ?? "");
      setSection("plan"); setMessage("Quest started. Your work is also available in Schedule.");
    });
  }
  async function progress(status: QuestProgressStatus) {
    await perform(status, async () => {
      setQuest(await updateQuestProgress(params.id, { status, evidenceUrl: evidence, completionNote: note }));
      setMessage(status === "COMPLETED" ? "Completion recorded as self-reported. No verified contribution points were awarded." : status === "SUBMITTED" ? "Submission link saved. You can update it as your contribution progresses." : "Quest reopened. Your notes and evidence have been kept.");
    });
  }

  if (!quest) return <div className="discovery-panel" role={error ? "alert" : "status"}>
    {error ? <><p>{error}</p><button type="button" className="discovery-control mt-4" onClick={() => setRevision((x) => x + 1)}>Retry</button><Link href="/explore/quests" className="ml-4 text-sm text-moss">Back to quests</Link></> : "Loading quest…"}
  </div>;

  const work = quest.progress?.work;
  const completed = quest.progress?.status === "COMPLETED";
  const member = user?.id !== "viewer";
  const dirtyPlan = plan !== (work?.plan ?? "") || blockers !== (work?.blockers ?? "");
  const startButton = <button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-moss px-5 text-sm font-semibold text-on-accent disabled:cursor-not-allowed disabled:opacity-50" disabled={Boolean(busy) || !member || (!work && !quest.isActive)} onClick={begin}>
    {busy === "start" ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}{quest.progress ? "Restore workspace" : "Start quest"}
  </button>;

  return <div className="pb-24 lg:pb-6">
    <Link href="/explore/quests" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-moss"><ArrowLeft size={15} />All quests</Link>
    <DiscoveryHeader title={quest.title} eyebrow={`${quest.organization.name} · quest`} description={quest.repository ? quest.repository.fullName || `${quest.organization.name}/${quest.repository.name}` : "An organization contribution"} />
    {error ? <div role="alert" className="mb-4 rounded-lg border border-danger/30 p-4 text-sm text-danger">{error}</div> : null}
    {message ? <p role="status" className="mb-4 rounded-lg border border-moss/25 bg-moss/5 p-4 text-sm text-moss">{message}</p> : null}
    {!quest.isActive ? <p className="mb-4 rounded-lg border border-line p-4 text-sm text-muted">This quest is no longer accepting new starts. Existing progress and notes remain available.</p> : null}

    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div id="quest-workspace" className="min-w-0 scroll-mt-32">
        <div role="group" aria-label="Quest workspace sections" className="mb-5 flex gap-1 border-b border-line">
          {[["brief", "The brief"], ["plan", "Your plan"], ["evidence", "Contribution & notes"]].map(([value, label]) => <button key={value} type="button" aria-pressed={section === value} onClick={() => setSection(value)} className={`min-h-12 border-b-2 px-2 text-xs font-medium sm:px-4 sm:text-sm ${section === value ? "border-moss text-moss" : "border-transparent text-muted hover:text-ink"}`}>{label}</button>)}
        </div>
        <section hidden={section !== "brief"} className="discovery-panel space-y-6">
          <div><p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted">The opportunity</p><p className="whitespace-pre-wrap text-sm leading-7 text-ink">{quest.description}</p></div>
          <div className="border-t border-line pt-6"><h2 className="text-base font-semibold">What completion looks like</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">{quest.acceptanceCriteria || "The author has not added separate acceptance criteria. Read the task brief and check the repository’s contribution guidelines before starting."}</p></div>
          {quest.resourceUrl ? <a href={quest.resourceUrl} target="_blank" rel="noreferrer" className="discovery-control"><ExternalLink size={15} />{quest.sourceUrl ? "Open task source" : "Open project on GitHub"}</a> : <p className="text-sm text-muted">No external source link has been provided.</p>}
        </section>

        <section hidden={section !== "plan"} className="discovery-panel">
          <h2 className="text-lg font-semibold">One clear next step.</h2><p className="mt-2 text-sm leading-6 text-muted">Break the task down and capture anything slowing you down. Your plan is private.</p>
          {work ? <form className="mt-6 space-y-5" onSubmit={(event) => {
            event.preventDefault();
            void perform("plan", async () => { await updateScheduledWork(work.id, { plan, blockers }); setQuest(await getQuest(params.id)); setMessage("Plan saved to your linked work item."); });
          }}>
            <label className="block text-sm font-medium">Plan<textarea className="discovery-input mt-2 min-h-44 py-3 leading-6" placeholder="What will you do first? What will you check before submitting?" maxLength={20000} value={plan} onChange={(event) => setPlan(event.target.value)} /></label>
            <label className="block text-sm font-medium">Blockers<textarea className="discovery-input mt-2 min-h-28 py-3 leading-6" placeholder="Questions, setup issues, or a review you’re waiting on…" maxLength={20000} value={blockers} onChange={(event) => setBlockers(event.target.value)} /></label>
            <button type="submit" className="discovery-control border-moss/40 text-moss" disabled={Boolean(busy) || !dirtyPlan}>{busy === "plan" ? "Saving…" : "Save plan"}</button><Link href={`/schedule/${work.id}`} className="ml-4 text-sm text-muted hover:text-moss">Open scheduled work →</Link>
            <div><button type="button" className="text-sm text-muted hover:text-moss disabled:opacity-40" disabled={Boolean(busy) || completed} onClick={() => perform("blocked", async () => { await updateScheduledWork(work.id, { plan, blockers }); await markScheduledWorkBlocked(work.id); setQuest(await getQuest(params.id)); setMessage("Plan saved and work marked blocked."); })}>Save & mark blocked</button></div>
          </form> : <p className="mt-6 text-sm text-muted">Start the quest to create your workspace and save a plan.</p>}
        </section>

        <section hidden={section !== "evidence"} className="discovery-panel">
          <h2 className="text-lg font-semibold">Keep the contribution connected.</h2><p className="mt-2 text-sm leading-6 text-muted">Add a PR, issue, or other evidence link and your closing notes. Completion here is self-reported, not verified acceptance.</p>
          {work ? <form className="mt-6 space-y-5" onSubmit={(event) => { event.preventDefault(); void progress("SUBMITTED"); }}>
            <label className="block text-sm font-medium">Contribution link<input type="url" className="discovery-input mt-2" placeholder="https://github.com/owner/repo/pull/123" maxLength={2048} value={evidence} onChange={(event) => setEvidence(event.target.value)} /></label>
            <label className="block text-sm font-medium">Notes<textarea className="discovery-input mt-2 min-h-36 py-3 leading-6" placeholder="What changed? What did you learn? What is still waiting on review?" maxLength={10000} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <div className="flex flex-wrap gap-3"><button type="button" className="discovery-control" disabled={Boolean(busy)} onClick={() => progress(completed ? "COMPLETED" : quest.progress?.status === "SUBMITTED" ? "SUBMITTED" : "STARTED")}>Save notes</button><button type="submit" className="discovery-control" disabled={Boolean(busy) || !evidence.trim()}>Save as submitted</button><button type="button" className="discovery-control border-moss/40 text-moss" disabled={Boolean(busy)} onClick={() => progress(completed ? "STARTED" : "COMPLETED")}>{completed ? "Reopen quest" : "Mark complete · self-reported"}</button></div>
          </form> : <p className="mt-6 text-sm text-muted">Start the quest to record your contribution.</p>}
        </section>
      </div>

      <aside className="discovery-panel lg:sticky lg:top-24">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Your progress</p>
        <h2 className="mt-3 flex items-center gap-2 text-xl font-semibold">{completed ? <CheckCircle2 size={20} className="text-moss" /> : null}{completed ? "Completed" : quest.progress?.status === "SUBMITTED" ? "Submitted" : work?.status === "BLOCKED" ? "Blocked" : quest.progress ? "In progress" : "Ready when you are"}</h2>
        <p className="mt-3 text-sm leading-6 text-muted">{completed ? "Recorded by you. This does not claim a verified merge or award contribution points." : "Your plan and progress stay linked to this quest and your schedule."}</p>
        <dl className="my-5 space-y-3 border-y border-line py-5 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted">Difficulty</dt><dd className="capitalize">{quest.difficulty.toLowerCase()}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Type</dt><dd className="text-right capitalize">{quest.type.replaceAll("_", " ").toLowerCase()}</dd></div></dl>
        {!member ? <Link href="/login" className="discovery-control w-full">Sign in to save progress</Link> : !work ? <div className="hidden lg:block">{startButton}</div> : <Link href={`/schedule/${work.id}`} className="discovery-control w-full"><GitBranch size={15} />Open linked work</Link>}
        <button type="button" className="discovery-control mt-3 w-full" aria-pressed={quest.isSaved} disabled={Boolean(busy) || !member} onClick={() => perform("save", async () => { const result = await toggleSavedOpportunity({ type: "QUEST", questId: quest.id }); setQuest({ ...quest, isSaved: result.saved }); })}><Bookmark size={15} className={quest.isSaved ? "fill-moss/20 text-moss" : ""} />{quest.isSaved ? "Saved to opportunities" : "Save for later"}</button>
        <p className="mt-5 font-mono text-[10px] text-muted">Updated {new Date(quest.updatedAt).toLocaleDateString()}</p>
        {quest.canManage ? <button type="button" className="mt-4 text-xs text-muted hover:text-ink" disabled={Boolean(busy)} onClick={() => perform("archive", async () => { const next = await (quest.isArchived ? restoreQuest(quest.id) : archiveQuest(quest.id)); setQuest(next); setMessage(next.isArchived ? "Quest archived. Existing contributors can keep their progress." : next.isActive ? "Quest restored and open to new starts." : "Quest restored. Reactivate its repository before accepting new starts."); })}>{quest.isArchived ? "Restore quest" : "Archive quest"}</button> : null}
      </aside>
    </div>
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-line bg-[var(--app-panel)] px-4 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] lg:hidden"><span className="text-xs text-muted">{completed ? "Completed · self-reported" : quest.progress ? "Your quest workspace" : "Make your next move"}</span>{work ? <button type="button" className="discovery-control text-moss" onClick={() => { setSection("plan"); document.getElementById("quest-workspace")?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }}>Your plan<ArrowRight size={15} /></button> : member ? startButton : <Link href="/login" className="discovery-control">Sign in</Link>}</div>
  </div>;
}
