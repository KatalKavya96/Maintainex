"use client";

import { ActivityLineChart, ActivityTypeChart } from "@/components/analytics/Charts";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { StatCard } from "@/components/dashboard/StatCard";
import { SummaryList } from "@/components/dashboard/SummaryList";
import { chartByOrganization, chartByRepository, summaryStats } from "@/lib/analytics";
import { useActivityStore } from "@/lib/activityStore";

export default function DashboardPage() {
  const { activities, resetAll } = useActivityStore();

  return (
    <>
      <PageTitle
        title="Dashboard"
        description="Track PR reviews, raised work, closures, notes, repositories, organizations, and progress across time."
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
        {summaryStats(activities).map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.85fr]">
        <ActivityLineChart activities={activities} />
        <RecentActivities activities={activities} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <ActivityTypeChart activities={activities} />
        <SummaryList title="Repository-wise summary" data={chartByRepository(activities)} />
        <SummaryList title="Organization-wise summary" data={chartByOrganization(activities)} />
      </div>
    </>
  );
}
