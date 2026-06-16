"use client";

import Link from "next/link";
import { ExternalLink, Heart, Star } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ProgramBadge } from "@/components/common/ProgramBadge";
import { ScoreBadge } from "@/components/common/ScoreBadge";
import { TechTag } from "@/components/common/TechTag";
import type { ExploreOrganization } from "@/types/explore";

const ratingStars = (score: number) => {
  const rounded = Math.round(score || 0);
  return Array.from({ length: 5 }, (_, index) => (
    <Star key={index} size={14} className={index < rounded ? "fill-moss text-moss" : "text-slate-600"} />
  ));
};

export function OrganizationCard({ organization, onSave, saving }: { organization: ExploreOrganization; onSave: (organization: ExploreOrganization) => void; saving?: boolean }) {
  return (
    <article className="rounded-lg border border-line bg-white p-4 shadow-soft transition hover:border-moss/60 hover:shadow-[0_0_32px_rgba(201,244,58,0.12)]">
      <div className="flex items-start gap-4">
        {organization.logoUrl ? (
          <img src={organization.logoUrl} alt="" className="h-14 w-14 rounded-full border border-line object-cover" />
        ) : (
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-moss/30 bg-moss/15 text-xl font-black text-moss">
            {organization.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-extrabold text-ink">{organization.name}</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {organization.programs.slice(0, 3).map((program) => (
              <ProgramBadge key={program.name} name={program.name} />
            ))}
          </div>
        </div>
      </div>
      <p className="mt-4 line-clamp-2 min-h-11 text-sm font-medium leading-6 text-slate-500">
        {organization.description || "No organization description has been synced yet."}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {organization.techStack.slice(0, 3).map((tag) => (
          <TechTag key={tag}>{tag}</TechTag>
        ))}
        {organization.techStack.length > 3 ? <TechTag>+{organization.techStack.length - 3}</TechTag> : null}
      </div>
      <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-lg border border-line bg-[#121615]">
        <div className="border-r border-line p-2">
          <ScoreBadge score={organization.maintianexScore} label={organization.scoreLabel} compact />
        </div>
        <div className="border-r border-line p-2 text-center">
          <p className="text-[11px] font-semibold text-slate-400">Active Repos</p>
          <p className="mt-2 text-lg font-black text-ink">{organization.activeReposCount}</p>
        </div>
        <div className="p-2 text-center">
          <p className="text-[11px] font-semibold text-slate-400">Open Quests</p>
          <p className="mt-2 text-lg font-black text-ink">{organization.openQuestsCount}</p>
        </div>
      </div>
      <div className="mt-1 grid grid-cols-3 overflow-hidden rounded-lg border border-line bg-[#121615]">
        <div className="border-r border-line p-2 text-center">
          <p className="text-[11px] font-semibold text-slate-400">Avg Review</p>
          <p className="mt-1 text-sm font-extrabold text-ink">{organization.averageReviewTimeDays ? `${organization.averageReviewTimeDays}d` : "No data"}</p>
        </div>
        <div className="border-r border-line p-2 text-center">
          <p className="text-[11px] font-semibold text-slate-400">Top Repo</p>
          <p className="mt-1 truncate text-sm font-extrabold text-ink">{organization.topRepository?.name ?? "No data"}</p>
        </div>
        <div className="p-2 text-center">
          <p className="text-[11px] font-semibold text-slate-400">Beginner Friendly</p>
          <div className="mt-1 flex justify-center gap-0.5">{ratingStars(organization.beginnerFriendlyScore)}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
        <Button href={`/explore/organizations/${organization.slug}`} className="h-9">
          View Org
          <ExternalLink size={14} />
        </Button>
        <button
          type="button"
          onClick={() => onSave(organization)}
          disabled={saving}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-moss/40 bg-skyglass px-4 text-sm font-extrabold text-moss transition hover:border-moss hover:bg-moss/10 disabled:opacity-50"
        >
          <Heart size={16} className={organization.isSaved ? "fill-moss" : ""} />
          Save
        </button>
      </div>
    </article>
  );
}
