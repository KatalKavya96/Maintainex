"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Grid2X2, List, Search, SlidersHorizontal, X } from "lucide-react";
import { EmptyState } from "@/design-system/patterns/MetricCard";
import { DiscoveryHeader, DiscoveryLoading, DiscoveryPagination } from "@/features/organizations/components/Discovery";
import { OrganizationCard } from "@/features/organizations/components/OrganizationCard";
import { beginnerOptions, categoryOptions, defaultOrganizationFilters, type OrganizationFilterState, programOptions, sortOptions, techStackOptions, yearOptions } from "@/features/organizations/components/OrganizationFilters";
import { getExploreOrganizations } from "@/data/api/organizations";
import type { ExploreOrganizationsResponse } from "@/types/explore";

export default function ExploreOrganizationsPage() { return <Suspense fallback={<DiscoveryLoading />}><OrganizationCatalogue /></Suspense>; }

function OrganizationCatalogue() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filters = useMemo(() => {
    const values = { ...defaultOrganizationFilters };
    for (const key of ["search", "program", "year", "techStack", "category", "beginnerFriendly", "sort"] as const) values[key] = params.get(key) ?? values[key];
    const page = Number(params.get("page"));
    values.page = Number.isInteger(page) && page > 0 && page <= 10000 ? page : 1;
    return values;
  }, [params]);
  const [draft, setDraft] = useState(filters.search);
  const [data, setData] = useState<ExploreOrganizationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [revision, setRevision] = useState(0);
  const filterLabels = { program: "Program", year: "Year", techStack: "Technology", category: "Category", beginnerFriendly: "Beginner rating" };
  const selected = Object.entries(filterLabels).filter(([key]) => filters[key as keyof OrganizationFilterState]);

  function updateFilters(next: Partial<OrganizationFilterState>) {
    const merged = { ...filters, ...next };
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) if (value && !(key === "page" && value === 1) && !(key === "sort" && value === defaultOrganizationFilters.sort)) query.set(key, String(value));
    router.replace(`${pathname}${query.size ? `?${query}` : ""}`, { scroll: false });
  }
  useEffect(() => setDraft(filters.search), [filters.search]);
  useEffect(() => {
    if (draft === filters.search) return;
    const timer = window.setTimeout(() => updateFilters({ search: draft, page: 1 }), 300);
    return () => window.clearTimeout(timer);
  }, [draft, filters]);
  useEffect(() => {
    const request = new AbortController();
    setLoading(true); setError("");
    getExploreOrganizations({ ...filters, limit: 12 }, request.signal)
      .then((result) => { if (!request.signal.aborted) setData(result); })
      .catch((err) => { if (!request.signal.aborted) { setData(null); setError(err.message ?? "Unable to load organizations."); } })
      .finally(() => { if (!request.signal.aborted) setLoading(false); });
    return () => request.abort();
  }, [filters, revision]);
  function select(label: string, key: "program" | "year" | "techStack" | "category" | "beginnerFriendly", options: { label: string; value: string }[]) {
    return <label className="block text-xs text-muted">{label}<select className="discovery-input mt-2" value={filters[key]} onChange={(event) => updateFilters({ [key]: event.target.value, page: 1 })}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
  }
  return <div>
    <DiscoveryHeader title="Find your community." description="Explore organizations, see where work is happening, and find a place to contribute." />
    <div className="mb-5 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={17} className="pointer-events-none absolute left-3 top-3.5 text-muted" /><input aria-label="Search organizations" value={draft} maxLength={120} onChange={(event) => setDraft(event.target.value)} placeholder="Search organizations, projects, or technologies…" className="discovery-input pl-10" /></div><select aria-label="Sort organizations" value={filters.sort} onChange={(event) => updateFilters({ sort: event.target.value, page: 1 })} className="discovery-input sm:w-48">{sortOptions.map((sort) => <option key={sort}>{sort}</option>)}</select></div>
    <details className="mb-5 rounded-xl border border-line bg-[var(--app-panel)]"><summary className="cursor-pointer rounded-xl px-4 py-3 text-sm font-medium"><span className="inline-flex items-center gap-2"><SlidersHorizontal size={15} />Refine your search{selected.length ? <span className="rounded-full bg-moss/10 px-2 text-xs text-moss">{selected.length}</span> : null}</span></summary><div className="grid gap-4 border-t border-line p-4 sm:grid-cols-2 xl:grid-cols-5">
      {select("Program", "program", [{ label: "All programs", value: "" }, ...programOptions.map((value) => ({ label: value, value }))])}
      {select("Year", "year", yearOptions.map((value) => ({ label: value, value: value === "All Years" ? "" : value })))}
      {select("Technology", "techStack", [{ label: "All technologies", value: "" }, ...techStackOptions.map((value) => ({ label: value, value }))])}
      {select("Category", "category", categoryOptions.map((value) => ({ label: value, value: value === "All Categories" ? "" : value })))}
      {select("Beginner rating", "beginnerFriendly", beginnerOptions)}
    </div></details>
    {selected.length || filters.search ? <div className="mb-5 flex flex-wrap gap-2">{selected.map(([key, label]) => <button key={key} type="button" className="inline-flex min-h-8 items-center gap-2 rounded-full border border-moss/25 bg-moss/5 px-3 text-xs text-moss" aria-label={`Remove ${label} filter`} onClick={() => updateFilters({ [key]: "", page: 1 })}>{label}: {key === "beginnerFriendly" ? `${filters.beginnerFriendly} stars+` : filters[key as keyof OrganizationFilterState]}<X size={12} /></button>)}<button type="button" className="px-2 text-xs text-muted hover:text-ink" onClick={() => router.replace(pathname, { scroll: false })}>Clear all</button></div> : null}
    <div className="mb-4 flex items-center justify-between gap-3"><p role="status" className="font-mono text-xs text-muted">{loading ? "Finding organizations…" : data ? `${data.pagination.total} ${data.pagination.total === 1 ? "organization" : "organizations"} found` : "Results unavailable"}</p><div role="group" aria-label="Results layout" className="flex gap-1"><button type="button" aria-label="Grid view" aria-pressed={view === "grid"} className={`discovery-control ${view === "grid" ? "text-moss" : ""}`} onClick={() => setView("grid")}><Grid2X2 size={16} /></button><button type="button" aria-label="List view" aria-pressed={view === "list"} className={`discovery-control ${view === "list" ? "text-moss" : ""}`} onClick={() => setView("list")}><List size={16} /></button></div></div>
    {error ? <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-danger/30 p-4 text-sm text-danger">{error}<button type="button" className="discovery-control" onClick={() => setRevision((x) => x + 1)}>Retry</button></div> : null}
    {loading ? <DiscoveryLoading /> : data?.items.length ? <div className={view === "grid" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>{data.items.map((organization) => <OrganizationCard key={organization.id} organization={organization} compact={view === "list"} />)}</div> : !error ? <EmptyState title="No organizations found." description="Try different filters, or connect GitHub to bring your organizations into Maintainex." action={<button type="button" className="discovery-control" onClick={() => router.replace(pathname)}>Clear filters</button>} /> : null}
    {!loading && data ? <DiscoveryPagination {...data.pagination} onChange={(page) => updateFilters({ page })} /> : null}
  </div>;
}
