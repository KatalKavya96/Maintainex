import Link from "next/link";
import { formatDate } from "@/lib/dateUtils";
import { ActivityBadge } from "@/components/activities/ActivityBadge";
import type { Activity } from "@/types/activity";

export function RecentActivities({ activities }: { activities: Activity[] }) {
  return (
    <section className="dcode-card rounded-2xl p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-black">Recent activity</h3>
        <Link className="text-sm font-semibold text-moss" href="/activities">
          View all
        </Link>
      </div>
      {activities.length === 0 ? (
        <div className="rounded-xl bg-skyglass p-8 text-center text-lg font-bold text-slate-500">No activity yet.</div>
      ) : (
      <div className="space-y-3">
        {activities.slice(0, 4).map((activity) => (
          <Link
            href={`/activities/${activity.id}`}
            key={activity.id}
            className="block rounded-xl border border-line bg-skyglass/40 p-4 transition hover:border-moss/50 hover:bg-skyglass"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ActivityBadge value={activity.activityType} />
              <span className="text-xs font-semibold text-slate-400">{formatDate(activity.date)}</span>
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
