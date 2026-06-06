import type { Activity } from "@/types/activity";

const monthFormatter = new Intl.DateTimeFormat("en", { month: "short" });

const levelFor = (count: number | null) => {
  if (count === null) return "future";
  if (count >= 4) return "4";
  if (count === 3) return "3";
  if (count === 2) return "2";
  if (count === 1) return "1";
  return "0";
};

export function ActivityHeatmap({ activities, ownerName }: { activities: Activity[]; ownerName?: string }) {
  const counts = activities.reduce<Record<string, number>>((acc, activity) => {
    acc[activity.date] = (acc[activity.date] ?? 0) + 1;
    return acc;
  }, {});

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(today.getDate() - 364);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 53 * 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    return { key, date, count: date > today ? null : counts[key] ?? 0 };
  });

  const weeks = Array.from({ length: 53 }, (_, index) => days.slice(index * 7, index * 7 + 7));
  const seenMonths = new Set<string>();
  const monthLabels = weeks.map((week) => {
    const marker = week.find((day) => day.date.getDate() <= 7);
    if (!marker) return "";
    const key = `${marker.date.getFullYear()}-${marker.date.getMonth()}`;
    if (seenMonths.has(key)) return "";
    seenMonths.add(key);
    return monthFormatter.format(marker.date);
  });

  const total = activities.length;

  return (
    <section className="rounded-xl border border-line bg-white p-4 shadow-soft">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold tracking-tight text-ink">Contribution heatmap</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {ownerName ? `${ownerName}'s` : "Your"} activity across the last year.
          </p>
        </div>
        <p className="text-sm font-bold text-moss">{total} total</p>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[820px]">
          <div className="ml-10 grid grid-flow-col auto-cols-[14px] gap-1 text-[10px] font-bold text-slate-500">
            {monthLabels.map((label, index) => (
              <span key={`${label}-${index}`} className="h-4">
                {label}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="grid grid-rows-7 gap-1 pt-1 text-[10px] font-bold text-slate-500">
              <span />
              <span>Mon</span>
              <span />
              <span>Wed</span>
              <span />
              <span>Fri</span>
              <span />
            </div>
            <div className="grid grid-flow-col grid-rows-7 gap-1">
              {days.map((day) => (
                <span
                  key={day.key}
                  title={day.count === null ? day.key : `${day.key}: ${day.count} activities`}
                  data-level={levelFor(day.count)}
                  className="heatmap-cell h-[14px] w-[14px] rounded-[3px]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 text-xs font-bold text-slate-500">
        <span>Less</span>
        {["0", "1", "2", "3", "4"].map((level) => (
          <span key={level} data-level={level} className="heatmap-cell h-3 w-3 rounded-[3px]" />
        ))}
        <span>More</span>
      </div>
    </section>
  );
}
