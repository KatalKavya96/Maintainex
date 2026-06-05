"use client";

import { pinCategories, labelize } from "@/lib/constants";

export function PinFilters({
  filters,
  onChange
}: {
  filters: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
}) {
  const set = (key: string, value: string) => onChange({ ...filters, [key]: value });
  return (
    <div className="mb-5 grid gap-3 rounded-xl border border-line bg-white p-4 shadow-soft md:grid-cols-4">
      <input className="h-10 rounded-lg border border-line px-3 text-sm outline-none focus:border-moss focus:ring-4 focus:ring-moss/10" placeholder="Search pins" value={filters.search ?? ""} onChange={(event) => set("search", event.target.value)} />
      <select className="h-10 rounded-lg border border-line px-3 text-sm outline-none focus:border-moss focus:ring-4 focus:ring-moss/10" value={filters.category ?? ""} onChange={(event) => set("category", event.target.value)}>
        <option value="">All categories</option>
        {pinCategories.map((category) => (
          <option key={category} value={category}>{labelize(category)}</option>
        ))}
      </select>
      <select className="h-10 rounded-lg border border-line px-3 text-sm outline-none focus:border-moss focus:ring-4 focus:ring-moss/10" value={filters.favorite ?? ""} onChange={(event) => set("favorite", event.target.value)}>
        <option value="">All pins</option>
        <option value="true">Favorites only</option>
      </select>
      <select className="h-10 rounded-lg border border-line px-3 text-sm outline-none focus:border-moss focus:ring-4 focus:ring-moss/10" value={filters.sort ?? "recent"} onChange={(event) => set("sort", event.target.value)}>
        <option value="recent">Recently added</option>
        <option value="oldest">Oldest</option>
        <option value="favorite">Favorites first</option>
        <option value="title">Title</option>
        <option value="lastOpened">Last opened</option>
        <option value="manual">Manual order</option>
      </select>
    </div>
  );
}
