"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ActivityLineChart, ActivityTypeChart, OrgChart, RepoChart } from "@/shared/analytics/Charts";
import { RangeToggle } from "@/shared/analytics/RangeToggle";
import { Button } from "@/design-system/patterns/Button";
import { PageTitle } from "@/design-system/patterns/PageTitle";
import { GoalPanel } from "@/features/overview/components/GoalPanel";
import { RecentActivities } from "@/features/overview/components/RecentActivities";
import { StatCard } from "@/features/overview/components/StatCard";
import { chartByOrganization, chartByRepository, summaryStats } from "@/shared/lib/analytics";
import { useActivityStore } from "@/state/activities";
import { filterActivitiesByRange, type TimeRange } from "@/shared/lib/timeRange";

export default function DashboardPage() {
  const { activities } = useActivityStore();
  const [range, setRange] = useState<TimeRange>("all");
  const [view, setView] = useState<"overview" | "repositories" | "organizations">("overview");
  const filteredActivities = useMemo(() => filterActivitiesByRange(activities, range), [activities, range]);
  const repositories = useMemo(() => chartByRepository(filteredActivities).sort((a, b) => b.value - a.value), [filteredActivities]);
  const organizations = useMemo(() => chartByOrganization(filteredActivities).sort((a, b) => b.value - a.value), [filteredActivities]);
  const dashboardStats = useMemo(
    () => summaryStats(filteredActivities).filter((stat) => ["Total Activities", "PRs Reviewed", "PRs Raised", "Issues Raised", "Issues Closed", "PRs Closed"].includes(stat.label)),
    [filteredActivities]
  );

  return (
    <>
      <PageTitle
        title="Dashboard"
        description="Contribution health, goals, repositories, organizations, and activity trends."
        action={
          <div className="flex min-w-0 flex-wrap gap-2">
            <RangeToggle value={range} onChange={setRange} />
            <Button href="/activities/new">Add activity</Button>
          </div>
        }
      />

      <GoalPanel />

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="my-4 max-w-full overflow-x-auto">
        <div className="inline-flex rounded-xl border border-line bg-panel p-1 shadow-soft">
          {[
            ["overview", "Overview"],
            ["repositories", "Repositories"],
            ["organizations", "Organizations"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setView(value as typeof view)}
              className={`h-9 rounded-lg px-4 text-sm font-bold transition ${view === value ? "bg-moss text-on-accent" : "text-muted hover:bg-skyglass hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "overview" ? (
        <>
          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)]">
            <ActivityLineChart activities={filteredActivities} />
            <ActivityTypeChart activities={filteredActivities} />
          </div>
          <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-3">
            <RepoChart activities={filteredActivities} />
            <OrgChart activities={filteredActivities} />
            <RecentActivities activities={activities} />
          </div>
        </>
      ) : null}

      {view === "repositories" ? (
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,.9fr)]">
          <RepoChart activities={filteredActivities} />
          <section className="rounded-xl border border-line bg-panel p-3 shadow-soft sm:p-4">
            <h2 className="text-base font-semibold text-ink">Repository view</h2>
            <div className="mt-3 divide-y divide-line">
              {repositories.map((repo) => {
                const activity = filteredActivities.find((item) => item.repositoryName === repo.name);
                const org = activity?.organizationName ?? "unknown";
                return (
                  <Link key={repo.name} href={`/repos/${encodeURIComponent(org)}/${encodeURIComponent(repo.name)}`} className="flex items-center justify-between gap-4 py-3 text-sm font-semibold hover:text-moss">
                    <span className="truncate text-ink">{org}/{repo.name}</span>
                    <span className="rounded-full bg-skyglass px-2.5 py-1 text-xs font-bold text-muted">{repo.value}</span>
                  </Link>
                );
              })}
              {!repositories.length ? <p className="py-6 text-sm font-semibold text-muted">No repository activity yet.</p> : null}
            </div>
          </section>
        </div>
      ) : null}

      {view === "organizations" ? (
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,.9fr)]">
          <OrgChart activities={filteredActivities} />
          <section className="rounded-xl border border-line bg-panel p-3 shadow-soft sm:p-4">
            <h2 className="text-base font-semibold text-ink">Organization view</h2>
            <div className="mt-3 divide-y divide-line">
              {organizations.map((org) => (
                <Link key={org.name} href={`/orgs/${encodeURIComponent(org.name)}`} className="flex items-center justify-between gap-4 py-3 text-sm font-semibold hover:text-moss">
                  <span className="truncate text-ink">{org.name}</span>
                  <span className="rounded-full bg-skyglass px-2.5 py-1 text-xs font-bold text-muted">{org.value}</span>
                </Link>
              ))}
              {!organizations.length ? <p className="py-6 text-sm font-semibold text-muted">No organization activity yet.</p> : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
