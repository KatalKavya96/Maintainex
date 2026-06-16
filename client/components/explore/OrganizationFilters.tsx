"use client";

import type { ReactNode } from "react";
import { RotateCcw, Search } from "lucide-react";
import clsx from "clsx";

export const programOptions = ["GSoC", "LFX", "CNCF", "Outreachy", "MLH"];
export const yearOptions = ["All Years", "2026", "2025", "2024", "2023", "2022 & earlier"];
export const techStackOptions = ["Cloud Native", "Developer Tools", "Web Development", "DevOps", "Data & AI", "Security", "JavaScript", "TypeScript", "React", "Go", "Python", "Rust", "Kubernetes", "Docker", "GraphQL"];
export const categoryOptions = ["All Categories", "Artificial Intelligence", "Cloud Native", "Developer Tools", "Web Development", "Infrastructure", "Security", "Documentation", "Data"];
export const beginnerOptions = [
  { label: "All", value: "" },
  { label: "1 star+", value: "1" },
  { label: "2 stars+", value: "2" },
  { label: "3 stars+", value: "3" },
  { label: "4 stars+", value: "4" }
];
export const sortOptions = ["Most Relevant", "Maintainex Score", "Most Active", "Fastest Review", "Most Quests", "Highest Reputation", "Beginner Friendly"];

export interface OrganizationFilterState {
  search: string;
  program: string;
  year: string;
  techStack: string;
  category: string;
  beginnerFriendly: string;
  sort: string;
  page: number;
}

export const defaultOrganizationFilters: OrganizationFilterState = {
  search: "",
  program: "",
  year: "",
  techStack: "",
  category: "",
  beginnerFriendly: "",
  sort: "Most Relevant",
  page: 1
};

const checkboxClass = (active: boolean) =>
  clsx(
    "grid h-4 w-4 place-items-center rounded border transition",
    active ? "border-moss bg-moss text-black shadow-[0_0_16px_rgba(201,244,58,0.2)]" : "border-line bg-[#101311]"
  );

export function OrganizationFilters({ filters, onChange, onReset }: { filters: OrganizationFilterState; onChange: (next: Partial<OrganizationFilterState>) => void; onReset: () => void }) {
  return (
    <aside className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
        <h2 className="text-lg font-extrabold text-ink">Filters</h2>
        <button type="button" onClick={onReset} className="inline-flex items-center gap-1.5 text-sm font-bold text-moss">
          <RotateCcw size={14} />
          Reset all
        </button>
      </div>
      <div className="space-y-5 pt-4">
        <FilterGroup title="Programs">
          {programOptions.map((program) => {
            const active = filters.program === program;
            return (
              <button key={program} type="button" onClick={() => onChange({ program: active ? "" : program, page: 1 })} className="flex w-full items-center gap-3 text-left text-sm font-semibold text-slate-400 transition hover:text-ink">
                <span className={checkboxClass(active)}>{active ? "✓" : null}</span>
                <span>{program}</span>
              </button>
            );
          })}
        </FilterGroup>

        <FilterGroup title="Year">
          {yearOptions.map((year) => {
            const value = year === "All Years" ? "" : year;
            const active = filters.year === value || (!filters.year && year === "All Years");
            return (
              <button key={year} type="button" onClick={() => onChange({ year: value, page: 1 })} className="flex w-full items-center gap-3 text-left text-sm font-semibold text-slate-400 transition hover:text-ink">
                <span className={clsx("h-4 w-4 rounded-full border", active ? "border-moss bg-moss shadow-[inset_0_0_0_4px_#101111]" : "border-line")} />
                <span>{year}</span>
              </button>
            );
          })}
        </FilterGroup>

        <FilterGroup title="Tech Stack">
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
            <input
              value={filters.search}
              onChange={(event) => onChange({ search: event.target.value, page: 1 })}
              placeholder="Search tech stack..."
              className="h-9 w-full rounded-lg border border-line bg-skyglass px-3 pr-9 text-sm font-semibold text-ink outline-none placeholder:text-slate-500 focus:border-moss"
            />
          </div>
          {techStackOptions.slice(0, 6).map((stack) => {
            const active = filters.techStack === stack;
            return (
              <button key={stack} type="button" onClick={() => onChange({ techStack: active ? "" : stack, page: 1 })} className="flex w-full items-center gap-3 text-left text-sm font-semibold text-slate-400 transition hover:text-ink">
                <span className={checkboxClass(active)}>{active ? "✓" : null}</span>
                <span>{stack}</span>
              </button>
            );
          })}
        </FilterGroup>

        <FilterGroup title="Category">
          <select value={filters.category} onChange={(event) => onChange({ category: event.target.value, page: 1 })} className="h-9 w-full rounded-lg border border-line bg-skyglass px-3 text-sm font-semibold text-ink outline-none focus:border-moss">
            {categoryOptions.map((category) => (
              <option key={category} value={category === "All Categories" ? "" : category}>
                {category}
              </option>
            ))}
          </select>
        </FilterGroup>

        <FilterGroup title="Beginner Friendly">
          <div className="grid grid-cols-4 gap-2">
            {beginnerOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => onChange({ beginnerFriendly: option.value, page: 1 })}
                className={clsx(
                  "h-8 rounded-lg border text-xs font-extrabold transition",
                  filters.beginnerFriendly === option.value ? "border-moss bg-moss/20 text-moss" : "border-line bg-skyglass text-ink hover:border-moss"
                )}
              >
                {option.label === "All" ? "All" : "★".repeat(Number(option.value))}
              </button>
            ))}
          </div>
        </FilterGroup>

        <button type="button" onClick={onReset} className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-moss/40 bg-skyglass text-sm font-bold text-moss transition hover:border-moss">
          <RotateCcw size={15} />
          Clear all filters
        </button>
      </div>
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-b border-line pb-4 last:border-b-0 last:pb-0">
      <h3 className="text-sm font-extrabold text-slate-400">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}
