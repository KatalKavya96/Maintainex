import Link from "next/link";
import { formatDate } from "@/lib/dateUtils";
import { ActivityBadge } from "@/components/activities/ActivityBadge";
import type { Activity } from "@/types/activity";

export function RecentActivities({ activities }: { activities: Activity[] }) {
  return (
    <section className="rounded-md border border-line bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">Recent activity</h3>
        <Link className="text-sm font-semibold text-moss" href="/activities">
          View all
        </Link>
      </div>
      {activities.length === 0 ? (
        <div className="rounded-md bg-slate-50 p-5 text-sm font-medium text-slate-500">No activity yet.</div>
      ) : (
      <div className="space-y-3">
        {activities.slice(0, 4).map((activity) => (
          <Link
            href={`/activities/${activity.id}`}
            key={activity.id}
            className="block rounded-md border border-line p-3 transition hover:border-moss/40 hover:bg-slate-50"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ActivityBadge value={activity.activityType} />
              <span className="text-xs text-slate-500">{formatDate(activity.date)}</span>
            </div>
            <p className="mt-2 font-semibold">{activity.title}</p>
            <p className="mt-1 text-sm text-slate-500">
              {activity.organizationName}/{activity.repositoryName} {activity.number}
            </p>
          </Link>
        ))}
      </div>
      )}
    </section>
  );
}
