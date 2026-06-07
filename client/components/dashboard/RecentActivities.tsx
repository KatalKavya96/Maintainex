import Link from "next/link";
import { formatDate } from "@/lib/dateUtils";
import { ActivityBadge } from "@/components/activities/ActivityBadge";
import type { Activity } from "@/types/activity";

export function RecentActivities({ activities }: { activities: Activity[] }) {
  return (
    <section className="min-w-0 rounded-xl border border-line bg-white p-3 shadow-soft sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-extrabold text-ink">Recent activity</h3>
        <Link className="text-sm font-semibold text-moss" href="/activities">
          View all
        </Link>
      </div>
      {activities.length === 0 ? (
        <div className="rounded-lg bg-skyglass p-6 text-center text-sm font-bold text-slate-500">No activity yet.</div>
      ) : (
      <div className="space-y-2.5">
        {activities.slice(0, 4).map((activity) => (
          <Link
            href={`/activities/${activity.id}`}
            key={activity.id}
            className="block rounded-lg border border-line bg-skyglass/40 p-3 transition hover:border-moss/50 hover:bg-skyglass"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ActivityBadge value={activity.activityType} />
              <span className="text-xs font-semibold text-slate-400">{formatDate(activity.date)}</span>
            </div>
            <p className="mt-2 truncate text-sm font-semibold text-ink">{activity.title}</p>
            <p className="mt-1 truncate text-xs font-semibold text-slate-500">
              {activity.organizationName}/{activity.repositoryName} {activity.number}
            </p>
          </Link>
        ))}
      </div>
      )}
    </section>
  );
}
