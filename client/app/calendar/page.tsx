"use client";

import { ActivityCalendar } from "@/components/calendar/ActivityCalendar";
import { ActivityHeatmap } from "@/components/calendar/ActivityHeatmap";
import { PageTitle } from "@/components/common/PageTitle";
import { useActivityStore } from "@/lib/activityStore";

export default function CalendarPage() {
  const { activities } = useActivityStore();

  return (
    <>
      <PageTitle title="Calendar" description="Review activity by selected date and scan consistency with a contribution heatmap." />
      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <ActivityHeatmap activities={activities} />
        <ActivityCalendar activities={activities} />
      </div>
    </>
  );
}
