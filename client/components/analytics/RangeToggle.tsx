import clsx from "clsx";
import { timeRangeOptions, type TimeRange } from "@/lib/timeRange";

export function RangeToggle({ value, onChange }: { value: TimeRange; onChange: (value: TimeRange) => void }) {
  return (
    <div className="max-w-full overflow-x-auto rounded-xl border border-line bg-white p-1 shadow-soft">
      <div className="inline-flex min-w-max">
        {timeRangeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={clsx(
              "h-8 rounded-lg px-2.5 text-xs font-bold transition sm:px-3 sm:text-sm",
              value === option.value ? "bg-moss text-black shadow-[0_8px_20px_rgba(201,244,58,0.18)]" : "text-slate-500 hover:bg-skyglass hover:text-ink"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
