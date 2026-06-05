"use client";

import { useEffect, useState } from "react";
import { ActivityLineChart, ActivityTypeChart } from "@/components/analytics/Charts";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { StatCard } from "@/components/dashboard/StatCard";
import { SummaryList } from "@/components/dashboard/SummaryList";
import { FavoritePins } from "@/components/pins/FavoritePins";
import { UpcomingWork } from "@/components/schedule/UpcomingWork";
import { chartByOrganization, chartByRepository, summaryStats } from "@/lib/analytics";
import { useActivityStore } from "@/lib/activityStore";
import { getPins, getScheduledWork } from "@/lib/api";
import type { ScheduledWork } from "@/types/scheduledWork";

const today = () => new Date().toISOString().slice(0, 10);

export default function DashboardPage() {
  const { activities, resetAll } = useActivityStore();
  const [featureStats, setFeatureStats] = useState([
    { label: "Pinned Links", value: 0 },
    { label: "Future Work", value: 0 },
    { label: "Due Today", value: 0 },
    { label: "Overdue Work", value: 0 },
    { label: "Blocked Work", value: 0 },
    { label: "High Priority Work", value: 0 },
    { label: "Assigned Issues", value: 0 }
  ]);

  useEffect(() => {
    Promise.all([getPins({ limit: 1 }), getScheduledWork({ limit: 100 })])
      .then(([pins, work]) => {
        const items = work.items;
        setFeatureStats([
          { label: "Pinned Links", value: pins.total },
          { label: "Future Work", value: work.total },
          { label: "Due Today", value: items.filter((item) => item.dueDate?.slice(0, 10) === today()).length },
          { label: "Overdue Work", value: items.filter((item) => item.dueDate && item.dueDate.slice(0, 10) < today() && item.status !== "DONE").length },
          { label: "Blocked Work", value: items.filter((item) => item.status === "BLOCKED").length },
          { label: "High Priority Work", value: items.filter((item) => item.priority === "HIGH" || item.priority === "URGENT").length },
          { label: "Assigned Issues", value: items.filter((item: ScheduledWork) => item.assignedToMe).length }
        ]);
      })
      .catch(() => undefined);
  }, []);

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
        {summaryStats(activities).map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
        {featureStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <FavoritePins />
        <UpcomingWork />
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
