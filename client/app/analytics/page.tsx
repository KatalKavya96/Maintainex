"use client";

import { ActivityLineChart, ActivityTypeChart, OrgChart, RepoChart } from "@/components/analytics/Charts";
import { PageTitle } from "@/components/common/PageTitle";
import { useActivityStore } from "@/lib/activityStore";

const tabs = ["Daily", "Weekly", "Monthly", "Yearly", "Custom range"];

export default function AnalyticsPage() {
  const { activities } = useActivityStore();

  return (
    <>
      <PageTitle title="Analytics" description="Compare contribution volume by date, type, repository, and organization." />
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            className={`h-10 rounded-md px-4 text-sm font-semibold ${index === 1 ? "bg-moss text-white" : "border border-line bg-white text-slate-600"}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ActivityLineChart activities={activities} />
        <ActivityTypeChart activities={activities} />
        <RepoChart activities={activities} />
        <OrgChart activities={activities} />
      </div>
    </>
  );
}
