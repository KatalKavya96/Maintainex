import clsx from "clsx";
import { timeRangeOptions, type TimeRange } from "@/lib/timeRange";

export function RangeToggle({ value, onChange }: { value: TimeRange; onChange: (value: TimeRange) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-line bg-white p-1 shadow-soft">
      {timeRangeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={clsx(
            "h-9 rounded-lg px-3 text-sm font-bold transition",
            value === option.value ? "bg-moss text-black shadow-[0_8px_20px_rgba(201,244,58,0.18)]" : "text-slate-500 hover:bg-skyglass hover:text-ink"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
