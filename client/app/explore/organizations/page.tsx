"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Grid2X2, List, Search } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/MetricCard";
import { OrganizationCard } from "@/components/explore/OrganizationCard";
import {
  beginnerOptions,
  categoryOptions,
  defaultOrganizationFilters,
  OrganizationFilters,
  type OrganizationFilterState,
  programOptions,
  sortOptions,
  techStackOptions,
  yearOptions
} from "@/components/explore/OrganizationFilters";
import { getExploreOrganizations, toggleSavedOpportunity } from "@/lib/api";
import type { ExploreOrganization, ExploreOrganizationsResponse } from "@/types/explore";

const filterFromParams = (params: URLSearchParams): OrganizationFilterState => ({
  search: params.get("search") ?? defaultOrganizationFilters.search,
  program: params.get("program") ?? defaultOrganizationFilters.program,
  year: params.get("year") ?? defaultOrganizationFilters.year,
  techStack: params.get("techStack") ?? defaultOrganizationFilters.techStack,
  category: params.get("category") ?? defaultOrganizationFilters.category,
  beginnerFriendly: params.get("beginnerFriendly") ?? defaultOrganizationFilters.beginnerFriendly,
  sort: params.get("sort") ?? defaultOrganizationFilters.sort,
  page: Number(params.get("page") ?? defaultOrganizationFilters.page) || 1
});

const filterParams = (filters: OrganizationFilterState) => ({
  search: filters.search,
  program: filters.program,
  year: filters.year,
  techStack: filters.techStack,
  category: filters.category,
  beginnerFriendly: filters.beginnerFriendly,
  sort: filters.sort,
  page: filters.page,
  limit: 9
});

export default function ExploreOrganizationsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => filterFromParams(searchParams), [searchParams]);
  const [data, setData] = useState<ExploreOrganizationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const updateFilters = (next: Partial<OrganizationFilterState>) => {
    const merged = { ...filters, ...next };
    const params = new URLSearchParams();
    Object.entries(merged).forEach(([key, value]) => {
      if (value && !(key === "page" && value === 1)) params.set(key, String(value));
    });
    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  const loadOrganizations = () => {
    setLoading(true);
    setError("");
    getExploreOrganizations(filterParams(filters))
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load organizations."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrganizations();
  }, [filters.search, filters.program, filters.year, filters.techStack, filters.category, filters.beginnerFriendly, filters.sort, filters.page]);

  async function saveOrganization(organization: ExploreOrganization) {
    setSavingId(organization.id);
    setError("");
    try {
      const result = await toggleSavedOpportunity({ type: "ORGANIZATION", organizationId: organization.id });
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) => (item.id === organization.id ? { ...item, isSaved: result.saved } : item))
            }
          : current
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save organization.");
    } finally {
      setSavingId("");
    }
  }

  const pagination = data?.pagination;

  return (
    <div className="grid gap-8 xl:grid-cols-[270px_1fr]">
      <OrganizationFilters filters={filters} onChange={updateFilters} onReset={() => router.replace(pathname, { scroll: false })} />
      <section className="min-w-0 border-line xl:border-l xl:pl-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-ink">Explore Organizations</h1>
            <p className="mt-3 text-base font-medium text-slate-500">Discover open-source organizations and find the perfect place to contribute.</p>
          </div>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2 min-[1700px]:grid-cols-3 min-[2100px]:grid-cols-6">
          <TopSelect label="Program" value={filters.program} options={["All", ...programOptions]} onChange={(value) => updateFilters({ program: value === "All" ? "" : value, page: 1 })} />
          <TopSelect label="Year" value={filters.year} options={yearOptions} emptyLabel="All Years" onChange={(value) => updateFilters({ year: value === "All Years" ? "" : value, page: 1 })} />
          <TopSelect label="Tech Stack" value={filters.techStack} options={["All", ...techStackOptions]} onChange={(value) => updateFilters({ techStack: value === "All" ? "" : value, page: 1 })} />
          <TopSelect label="Category" value={filters.category} options={categoryOptions} emptyLabel="All Categories" onChange={(value) => updateFilters({ category: value === "All Categories" ? "" : value, page: 1 })} />
          <TopSelect label="Beginner Friendly" value={filters.beginnerFriendly} options={beginnerOptions.map((option) => option.label)} valueForLabel={(label) => beginnerOptions.find((option) => option.label === label)?.value ?? ""} onChange={(value) => updateFilters({ beginnerFriendly: value, page: 1 })} />
          <TopSelect label="Sort By" value={filters.sort} options={sortOptions} onChange={(value) => updateFilters({ sort: value, page: 1 })} />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-semibold text-ink">{loading ? "Loading organizations..." : `${data?.pagination.total ?? 0} organizations found`}</p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                value={filters.search}
                onChange={(event) => updateFilters({ search: event.target.value, page: 1 })}
                placeholder="Search organizations..."
                className="h-10 w-80 max-w-full rounded-lg border border-line bg-skyglass pl-9 pr-3 text-sm font-semibold text-ink outline-none placeholder:text-slate-500 focus:border-moss"
              />
            </div>
            <ViewButton active={view === "grid"} label="Grid view" onClick={() => setView("grid")}>
              <Grid2X2 size={18} />
            </ViewButton>
            <ViewButton active={view === "list"} label="List view" onClick={() => setView("list")}>
              <List size={18} />
            </ViewButton>
          </div>
        </div>

        {error ? (
          <div className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <Button type="button" variant="secondary" onClick={loadOrganizations}>
                Retry
              </Button>
            </div>
          </div>
        ) : null}

        <div className={clsx("mt-6 grid gap-6", view === "grid" ? "min-[1500px]:grid-cols-2 min-[2100px]:grid-cols-3" : "grid-cols-1")}>
          {loading
            ? Array.from({ length: 6 }, (_, index) => <OrganizationSkeleton key={index} />)
            : data?.items.map((organization) => (
                <OrganizationCard key={organization.id} organization={organization} onSave={saveOrganization} saving={savingId === organization.id} />
              ))}
        </div>

        {!loading && data && data.items.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No organizations found for these filters."
              description="Try clearing one or two filters, or sync GitHub data so Maintainex can calculate discovery results."
              action={<Button type="button" onClick={() => router.replace(pathname)}>Clear filters</Button>}
            />
          </div>
        ) : null}

        {pagination && pagination.totalPages > 1 ? (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center justify-center gap-2">
              <PageButton disabled={pagination.page <= 1} onClick={() => updateFilters({ page: pagination.page - 1 })}>
                ‹
              </PageButton>
              {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, index) => index + 1).map((page) => (
                <PageButton key={page} active={page === pagination.page} onClick={() => updateFilters({ page })}>
                  {page}
                </PageButton>
              ))}
              {pagination.totalPages > 3 ? <span className="px-2 text-sm font-bold text-slate-500">...</span> : null}
              {pagination.totalPages > 3 ? (
                <PageButton active={pagination.totalPages === pagination.page} onClick={() => updateFilters({ page: pagination.totalPages })}>
                  {pagination.totalPages}
                </PageButton>
              ) : null}
              <PageButton disabled={pagination.page >= pagination.totalPages} onClick={() => updateFilters({ page: pagination.page + 1 })}>
                ›
              </PageButton>
            </div>
            <p className="text-sm font-semibold text-slate-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} organizations
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function TopSelect({
  label,
  value,
  options,
  emptyLabel,
  valueForLabel,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  emptyLabel?: string;
  valueForLabel?: (label: string) => string;
  onChange: (value: string) => void;
}) {
  const displayValue = valueForLabel ? options.find((option) => valueForLabel(option) === value) ?? options[0] : value || emptyLabel || options[0];
  return (
    <label className="flex min-h-12 items-center justify-between gap-4 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-slate-400">
      <span>{label}</span>
      <select value={displayValue} onChange={(event) => onChange(valueForLabel ? valueForLabel(event.target.value) : event.target.value)} className="min-w-0 rounded border border-line bg-skyglass px-3 py-1.5 text-xs font-bold text-ink outline-none">
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ViewButton({ active, label, children, onClick }: { active: boolean; label: string; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={clsx("grid h-10 w-11 place-items-center rounded-lg border transition", active ? "border-moss bg-moss/15 text-moss" : "border-line bg-white text-slate-400 hover:text-ink")}
    >
      {children}
    </button>
  );
}

function PageButton({ children, active, disabled, onClick }: { children: ReactNode; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx("grid h-10 min-w-10 place-items-center rounded-lg border px-3 text-sm font-extrabold transition", active ? "border-moss bg-moss/15 text-moss" : "border-line bg-white text-slate-400 hover:text-ink", disabled && "cursor-not-allowed opacity-40")}
    >
      {children}
    </button>
  );
}

function OrganizationSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex gap-5">
        <div className="h-16 w-16 rounded-full bg-skyglass" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-2/3 rounded bg-skyglass" />
          <div className="h-4 w-1/2 rounded bg-skyglass" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <div className="h-4 rounded bg-skyglass" />
        <div className="h-4 w-4/5 rounded bg-skyglass" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="h-16 rounded bg-skyglass" />
        <div className="h-16 rounded bg-skyglass" />
        <div className="h-16 rounded bg-skyglass" />
      </div>
    </div>
  );
}
