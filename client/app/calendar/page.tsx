"use client";

import { ActivityCalendar } from "@/components/calendar/ActivityCalendar";
import { PageTitle } from "@/components/common/PageTitle";
import { useActivityStore } from "@/lib/activityStore";

export default function CalendarPage() {
  const { activities } = useActivityStore();

  return (
    <>
      <PageTitle title="Calendar" description="Review activity grouped by date." />
      <div className="grid gap-6">
        <ActivityCalendar activities={activities} />
      </div>
    </>
  );
}
