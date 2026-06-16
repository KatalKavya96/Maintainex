import Link from "next/link";
import { CircleDot, GitFork, Scale, Star } from "lucide-react";
import { ScoreBadge } from "@/components/common/ScoreBadge";
import { TechTag } from "@/components/common/TechTag";
import type { ExploreRepositorySummary } from "@/types/explore";

export function RepositoryCard({ repository, orgSlug }: { repository: ExploreRepositorySummary; orgSlug?: string }) {
  const href = orgSlug ? `/repos/${orgSlug}/${repository.slug}` : repository.githubUrl ?? "/coming-soon?feature=repository";
  return (
    <article className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-moss/30 bg-moss/15 text-sm font-black text-moss">
            {repository.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <Link href={href} className="block truncate text-base font-extrabold text-ink hover:text-moss">
              {repository.name}
            </Link>
            <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500">{repository.description || "No repository description has been synced yet."}</p>
          </div>
        </div>
        <div className="shrink-0 rounded-lg border border-line bg-skyglass px-3 py-2">
          <ScoreBadge score={repository.maintianexScore} label={repository.scoreLabel} compact />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
        {repository.primaryLanguage ? <TechTag>{repository.primaryLanguage}</TechTag> : null}
        {repository.license ? (
          <span className="inline-flex items-center gap-1">
            <Scale size={13} />
            {repository.license}
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Star size={14} />
          {repository.stars.toLocaleString()}
        </span>
        <span className="inline-flex items-center gap-1">
          <GitFork size={14} />
          {repository.forks.toLocaleString()}
        </span>
        <span className="inline-flex items-center gap-1">
          <CircleDot size={14} />
          {repository.openIssues.toLocaleString()}
        </span>
      </div>
    </article>
  );
}
