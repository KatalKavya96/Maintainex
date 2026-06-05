"use client";

import { useMemo, useState } from "react";
import { ActivityLineChart, ActivityTypeChart, OrgChart, RepoChart } from "@/components/analytics/Charts";
import { RangeToggle } from "@/components/analytics/RangeToggle";
import { PageTitle } from "@/components/common/PageTitle";
import { useActivityStore } from "@/lib/activityStore";
import { filterActivitiesByRange, type TimeRange } from "@/lib/timeRange";

export default function AnalyticsPage() {
  const { activities } = useActivityStore();
  const [range, setRange] = useState<TimeRange>("weekly");
  const filteredActivities = useMemo(() => filterActivitiesByRange(activities, range), [activities, range]);

  return (
    <>
      <PageTitle
        title="Analytics"
        description="Compare contribution volume by date, type, repository, and organization."
        action={<RangeToggle value={range} onChange={setRange} />}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <ActivityLineChart activities={filteredActivities} />
        <ActivityTypeChart activities={filteredActivities} />
        <RepoChart activities={filteredActivities} />
        <OrgChart activities={filteredActivities} />
      </div>
    </>
  );
}
