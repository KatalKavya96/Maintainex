import type { Activity } from "@/types/activity";

export function ActivityHeatmap({ activities }: { activities: Activity[] }) {
  const counts = activities.reduce<Record<string, number>>((acc, activity) => {
    acc[activity.date] = (acc[activity.date] ?? 0) + 1;
    return acc;
  }, {});
  const start = new Date();
  start.setDate(start.getDate() - 41);
  start.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    return { key, count: counts[key] ?? 0 };
  });

  const color = (count: number) => {
    if (count >= 3) return "bg-moss";
    if (count === 2) return "bg-[#6FA895]";
    if (count === 1) return "bg-[#B9DBD0]";
    return "bg-slate-100";
  };

  return (
    <section className="rounded-md border border-line bg-white p-5 shadow-soft">
      <h3 className="mb-4 text-lg font-bold">Yearly consistency heatmap</h3>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div
            key={day.key}
            title={`${day.key}: ${day.count} activities`}
            className={`aspect-square rounded-sm border border-white ${color(day.count)}`}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <span>Less</span>
        {[0, 1, 2, 3].map((count) => (
          <span key={count} className={`h-3 w-3 rounded-sm ${color(count)}`} />
        ))}
        <span>More</span>
      </div>
    </section>
  );
}
