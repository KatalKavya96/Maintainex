"use client";

import Link from "next/link";
import { ArrowUpRight, GitBranch } from "lucide-react";
import { ProgramBadge } from "@/design-system/patterns/ProgramBadge";
import { TechTag } from "@/design-system/patterns/TechTag";
import type { ExploreOrganization } from "@/types/explore";

export function OrganizationCard({ organization, compact = false }: { organization: ExploreOrganization; onSave?: (organization: ExploreOrganization) => void; saving?: boolean; compact?: boolean }) {
  const href = `/explore/organizations/${encodeURIComponent(organization.slug)}`;
  return <article className={`group rounded-xl border border-line bg-[var(--app-panel)] p-5 transition hover:border-moss/40 ${compact ? "flex flex-wrap items-center gap-5" : "flex flex-col"}`}>
    <div className={`flex min-w-0 items-start gap-3 ${compact ? "flex-1" : ""}`}>
      {organization.logoUrl ? <img src={organization.logoUrl} alt="" className="h-11 w-11 shrink-0 rounded-xl border border-line object-cover" /> : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-moss/20 bg-moss/5 font-mono text-lg text-moss">{organization.name.slice(0, 1).toUpperCase()}</span>}
      <div className="min-w-0"><Link href={href} className="block truncate text-lg font-semibold text-ink group-hover:text-moss">{organization.name}</Link><p className={`mt-1 text-sm leading-6 text-muted ${compact ? "line-clamp-1" : "line-clamp-2"}`}>{organization.description || "No description available yet."}</p></div>
    </div>
    {!compact ? <><div className="mt-4 flex flex-wrap gap-2">{organization.programs.slice(0, 3).map((program) => <ProgramBadge key={program.name} name={program.name} />)}{organization.techStack.slice(0, 2).map((tag) => <TechTag key={tag}>{tag}</TechTag>)}</div><div className="mb-5 mt-auto pt-6"><div className="grid grid-cols-2 gap-3 border-y border-line py-4">{[["Score", organization.maintianexScore], ["Active repos", organization.activeReposCount]].map(([label, value]) => <div key={label}><p className="font-mono text-lg text-ink">{value}</p><p className="mt-1 text-[11px] text-muted">{label}</p></div>)}</div></div></> : <p className="inline-flex items-center gap-2 font-mono text-xs text-muted"><GitBranch size={14} />{organization.activeReposCount} {organization.activeReposCount === 1 ? "repo" : "repos"}</p>}
    <div className={`flex items-center gap-3 ${compact ? "" : "justify-between"}`}><Link href={href} className="inline-flex items-center gap-2 text-sm font-medium text-ink">Explore<ArrowUpRight size={15} className="text-moss" /></Link></div>
  </article>;
}
