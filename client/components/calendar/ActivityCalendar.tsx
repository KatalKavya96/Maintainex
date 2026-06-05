import { formatDate } from "@/lib/dateUtils";
import type { Activity } from "@/types/activity";

export function ActivityCalendar({ activities }: { activities: Activity[] }) {
  const grouped = activities.reduce<Record<string, Activity[]>>((acc, activity) => {
    acc[activity.date] = [...(acc[activity.date] ?? []), activity];
    return acc;
  }, {});

  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-soft">
      <h3 className="mb-4 text-base font-bold">Date-wise activity</h3>
      {activities.length === 0 ? <div className="rounded-xl bg-skyglass p-5 text-sm font-semibold text-slate-500">No activity yet.</div> : null}
      <div className="space-y-4">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="rounded-xl border border-line p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-bold">{formatDate(date)}</h4>
              <span className="rounded-lg bg-skyglass px-2 py-1 text-xs font-bold text-moss">{items.length} activities</span>
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
              {items.map((item) => (
                <li key={item.id}>
                  {item.activityType.replaceAll("_", " ").toLowerCase()} {item.number} in {item.organizationName}/{item.repositoryName}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
