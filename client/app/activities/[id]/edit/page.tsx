"use client";

import { useParams } from "next/navigation";
import { ActivityForm } from "@/components/activities/ActivityForm";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { useActivityStore } from "@/lib/activityStore";

export default function EditActivityPage() {
  const params = useParams<{ id: string }>();
  const { activities } = useActivityStore();
  const activity = activities.find((item) => item.id === params.id);

  if (!activity) {
    return (
      <div className="rounded-xl border border-line bg-white p-8 text-center shadow-soft">
        <p className="text-lg font-bold">Activity not found</p>
        <p className="mt-2 text-sm text-slate-500">It may have been deleted or cleared during reset.</p>
        <Button href="/activities" className="mt-5">
          Back to activities
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageTitle title="Edit Activity" description="Update the tracked contribution details." />
      <ActivityForm activity={activity} />
    </>
  );
}
