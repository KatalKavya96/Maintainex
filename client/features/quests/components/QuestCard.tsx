import Link from "next/link";
import { ArrowUpRight, Bookmark, CheckCircle2, GitBranch, Loader2 } from "lucide-react";
import type { OrganizationQuestsResponse } from "@/types/explore";
import type { Quest } from "@/types/quest";

export function QuestCard({ quest, onSave, saving }: { quest: OrganizationQuestsResponse["items"][number] | Quest; onSave?: () => void; saving?: boolean }) {
  const progress = "progress" in quest ? quest.progress : null;
  const saved = "isSaved" in quest && quest.isSaved;
  const available = !("isActive" in quest) || quest.isActive;
  const completed = progress?.status === "COMPLETED";
  return <article className="group flex min-w-0 flex-col rounded-xl border border-line bg-[var(--app-panel)] p-5 transition hover:border-moss/40">
    <div className="flex items-center justify-between gap-3"><span className="font-mono text-[10px] uppercase tracking-wider text-muted">{quest.type.replaceAll("_", " ")}</span>{onSave ? <button type="button" onClick={onSave} disabled={saving} aria-label={saved ? `Unsave ${quest.title}` : `Save ${quest.title}`} aria-pressed={saved} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-muted hover:text-moss disabled:opacity-50">{saving ? <Loader2 size={15} className="animate-spin" /> : <Bookmark size={15} className={saved ? "fill-moss/20 text-moss" : ""} />}</button> : null}</div>
    <Link href={`/explore/quests/${encodeURIComponent(quest.id)}`} className="mt-4 text-lg font-semibold leading-6 text-ink group-hover:text-moss">{quest.title}</Link>
    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{quest.description}</p>
    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full border border-line px-2.5 py-1 capitalize text-muted">{quest.difficulty.toLowerCase()}</span>{completed ? <span className="inline-flex items-center gap-1 text-moss"><CheckCircle2 size={13} />Completed · self-reported</span> : progress ? <span className="text-moss">{progress.status === "SUBMITTED" ? "Submitted" : progress.work?.status === "BLOCKED" ? "Blocked" : "In progress"}</span> : !available ? <span className="text-muted">Unavailable</span> : null}</div>
    <div className="mt-auto pt-5"><p className="mb-4 flex items-center gap-1.5 truncate border-t border-line pt-4 font-mono text-[11px] text-muted"><GitBranch size={13} />{"organization" in quest ? quest.organization.name : ""}{quest.repository ? `${"organization" in quest ? "/" : ""}${quest.repository.name}` : ""}</p><Link href={`/explore/quests/${encodeURIComponent(quest.id)}`} className="flex items-center justify-between text-sm font-semibold text-ink">{completed ? "View contribution" : progress ? "Continue quest" : "Explore quest"}<ArrowUpRight size={16} className="text-moss" /></Link></div>
  </article>;
}
