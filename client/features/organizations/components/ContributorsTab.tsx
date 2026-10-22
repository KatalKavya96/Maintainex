"use client";

import { CalendarDays, Flame } from "lucide-react";

import { EmptyState } from "@/design-system/patterns/MetricCard";

import type { OrganizationContributorsResponse } from "@/types/explore";
import { ContributorSummary } from "./ContributorSummary";

export function ContributorsTab({ data }: { data: OrganizationContributorsResponse | null }) {
  if (!data || data.items.length === 0) {
    return <EmptyState title="No contributors found yet." description="Contributors will appear after activities are synced for this organization." />;
  }

  return (
    <div className="grid gap-6 2xl:grid-cols-[1fr_400px]">
      <div className="overflow-hidden rounded-lg border border-line">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-panel p-4">
          <button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-skyglass px-3 text-sm font-bold text-ink">
            All activities
          </button>
          <button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-skyglass px-3 text-sm font-bold text-ink">
            <CalendarDays size={15} />
            Past 365 days
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line bg-skyglass text-xs font-bold text-muted">
              <tr>
                <th className="px-4 py-3">Contributor</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Total Contribution</th>
                <th className="px-4 py-3">Quests Completed</th>
                <th className="px-4 py-3">Current Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.items.slice(0, 7).map((contributor) => (
                <tr key={contributor.user.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-muted">{contributor.rank}</span>
                      {contributor.user.avatarUrl ? (
                        <img src={contributor.user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-skyglass text-xs font-semibold text-moss">
                          {contributor.user.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className="font-bold text-ink">{contributor.user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded border border-moss/20 bg-moss/10 px-2 py-1 text-xs font-bold text-moss">{contributor.role}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">
                    {contributor.totalContribution.toLocaleString()} <span className="ml-3 font-medium text-muted">{contributor.contributionPercentage}%</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{contributor.questsCompleted}</td>
                  <td className="px-4 py-3 text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Flame size={15} className="text-muted" />
                      {contributor.currentStreak} days
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ContributorSummary data={data} />
    </div>
  );
}
