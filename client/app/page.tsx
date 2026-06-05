"use client";

import { useMemo, useState } from "react";
import { ActivityLineChart, ActivityTypeChart, OrgChart, RepoChart } from "@/components/analytics/Charts";
import { RangeToggle } from "@/components/analytics/RangeToggle";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { StatCard } from "@/components/dashboard/StatCard";
import { summaryStats } from "@/lib/analytics";
import { useActivityStore } from "@/lib/activityStore";
import { filterActivitiesByRange, type TimeRange } from "@/lib/timeRange";

export default function DashboardPage() {
  const { activities, resetAll } = useActivityStore();
  const [range, setRange] = useState<TimeRange>("weekly");
  const visualActivities = useMemo(() => filterActivitiesByRange(activities, range), [activities, range]);
  const topStats = useMemo(
    () => summaryStats(activities).filter((stat) => ["Total Activities", "PRs Reviewed", "PRs Raised", "Issues Raised"].includes(stat.label)),
    [activities]
  );

  return (
    <>
      <PageTitle
        title="Dashboard"
        description="Welcome back. Here's your contribution overview, work queue, pinned resources, and public progress."
        action={
          <div className="flex gap-2">
            <Button href="/activities/new">Add activity</Button>
            <Button type="button" variant="secondary" onClick={resetAll}>
              Reset data
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">Contribution visuals</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Switch the range to update every chart below.</p>
        </div>
        <RangeToggle value={range} onChange={setRange} />
      </div>

      <div className="mt-4 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <ActivityLineChart activities={visualActivities} />
        <ActivityTypeChart activities={visualActivities} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <RepoChart activities={visualActivities} />
        <OrgChart activities={visualActivities} />
        <RecentActivities activities={activities} />
      </div>
    </>
  );
}
