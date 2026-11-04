"use client";

import { useParams } from "next/navigation";
import { ActivityForm } from "@/features/activities/components/ActivityForm";
import { Button } from "@/design-system/patterns/Button";
import { PageTitle } from "@/design-system/patterns/PageTitle";
import { AsyncState } from "@/design-system";
import { useActivityRecord } from "../hooks/useActivityRecord";

export default function EditActivityPage() {
  const params = useParams<{ id: string }>();
  const { activity, loading, error, retry } = useActivityRecord(params.id);
  if (loading || error) return <AsyncState state={loading ? "loading" : "error"} onRetry={retry} />;

  if (!activity) {
    return (
      <div className="rounded-xl border border-line bg-panel p-8 text-center shadow-soft">
        <p className="text-lg font-bold">Activity not found</p>
        <p className="mt-2 text-sm text-muted">It may have been deleted or cleared during reset.</p>
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
