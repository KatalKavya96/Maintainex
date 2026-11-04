"use client";

import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ActivityBadge } from "@/features/activities/components/ActivityBadge";
import { Button } from "@/design-system/patterns/Button";
import { labelize } from "@/shared/lib/constants";
import { formatDate } from "@/shared/lib/dateUtils";
import { webHref } from "@/shared/lib/webHref";
import { AsyncState } from "@/design-system";
import { useActivityRecord } from "../hooks/useActivityRecord";

export default function ActivityDetailsPage() {
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

  const rows = [
    ["Date", formatDate(activity.date)],
    ["Organization", activity.organizationName],
    ["Repository", activity.repositoryName],
    ["Number", activity.number || "Not added"],
    ["Status", labelize(activity.status)],
    ["Review Type", labelize(activity.reviewType)],
    ["Closing Reason", labelize(activity.closingReason)],
    ["Created", new Date(activity.createdAt).toLocaleString()],
    ["Last Updated", new Date(activity.updatedAt).toLocaleString()]
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <ActivityBadge value={activity.activityType} />
          <h2 className="mt-3 text-3xl font-bold">{activity.title}</h2>
          <p className="mt-2 text-muted">
            {activity.organizationName}/{activity.repositoryName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button href="/activities" variant="secondary">
            Back
          </Button>
          <Button href={`/activities/${activity.id}/edit`}>Edit</Button>
        </div>
      </div>
      <section className="rounded-xl border border-line bg-panel p-5 shadow-soft">
        <dl className="grid gap-4 md:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm font-semibold text-muted">{label}</dt>
              <dd className="mt-1 font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 border-t border-line pt-5">
          <h3 className="font-bold">Notes</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{activity.notes || "No notes added."}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {activity.tags.map((tag) => (
              <span key={tag} className="rounded-lg bg-skyglass px-2 py-1 text-xs font-semibold text-muted">
                {tag}
              </span>
            ))}
          </div>
          {webHref(activity.link) ? (
            <Button href={webHref(activity.link)!} variant="secondary" className="mt-5" target="_blank" rel="noopener noreferrer">
              <ExternalLink size={16} />
              Open source link
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
