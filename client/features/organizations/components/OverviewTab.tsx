"use client";

import { EmptyState } from "@/design-system/patterns/MetricCard";

import { ScoreBadge } from "@/design-system/patterns/ScoreBadge";

import type { ExploreOrganization, OrganizationRepositoriesResponse } from "@/types/explore";

export function OverviewTab({ organization, repositories }: { organization: ExploreOrganization; repositories: OrganizationRepositoriesResponse["items"] }) {
  const breakdown = organization.scoreBreakdown ? Object.entries(organization.scoreBreakdown).filter(([, value]) => value > 0) : [];
  return (
    <div className="grid gap-6 2xl:grid-cols-[1fr_400px]">
      <div className="rounded-lg border border-line bg-panel p-5">
        <h2 className="text-lg font-semibold text-ink">Score breakdown</h2>
        {breakdown.length ? (
          <div className="mt-4 space-y-3">
            {breakdown.map(([label, value]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-xs font-bold text-muted">
                  <span>{label.replace(/([A-Z])/g, " $1")}</span>
                  <span>{value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-skyglass">
                  <div className="h-full rounded-full bg-moss" style={{ width: `${Math.min(100, value * 4)}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No score explanation yet." description="Score breakdowns will appear once enough activity, repository, and program data exists." />
        )}
      </div>
      <div className="rounded-lg border border-line bg-panel p-5">
        <ScoreBadge score={organization.maintianexScore} label={organization.scoreLabel} />
        <p className="mt-4 text-sm font-medium leading-6 text-muted">{repositories.length} top repositories are available from synced data.</p>
      </div>
    </div>
  );
}
