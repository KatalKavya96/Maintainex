import { Search } from "lucide-react";
import { activityTypes, closingReasons, labelize, statuses } from "@/lib/constants";

export function ActivityFilters() {
  return (
    <div className="mb-5 grid gap-3 rounded-md border border-line bg-white p-4 shadow-soft md:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <label className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={17} />
        <input
          className="h-11 w-full rounded-md border border-line bg-white pl-10 pr-3 text-sm outline-none focus:border-moss focus:ring-2 focus:ring-moss/15"
          placeholder="Search title, number, tag"
        />
      </label>
      <select className="h-11 rounded-md border border-line bg-white px-3 text-sm">
        <option>All types</option>
        {activityTypes.map((type) => (
          <option key={type}>{labelize(type)}</option>
        ))}
      </select>
      <select className="h-11 rounded-md border border-line bg-white px-3 text-sm">
        <option>All statuses</option>
        {statuses.map((status) => (
          <option key={status}>{labelize(status)}</option>
        ))}
      </select>
      <select className="h-11 rounded-md border border-line bg-white px-3 text-sm">
        <option>All closing reasons</option>
        {closingReasons.map((reason) => (
          <option key={reason}>{labelize(reason)}</option>
        ))}
      </select>
    </div>
  );
}
