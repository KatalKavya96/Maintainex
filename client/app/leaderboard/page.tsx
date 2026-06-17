"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Boxes, Cloud, Code2, Crown, Database, Grid2X2, Heart, Layers3 } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/MetricCard";
import { LeaderboardCard, type RankingRow } from "@/components/leaderboards/LeaderboardCard";
import { getActiveRepositories, getCollections, getOpenSourceIndex, getTopContributors, getTopOrganizations } from "@/lib/api";
import type { ActiveRepositoryEntry, CollectionEntry, OpenSourceIndexItem, OpenSourceIndexResponse, TopContributorEntry, TopOrganizationEntry } from "@/types/leaderboards";

type IndexTab = "byStack" | "byIndustry" | "bySoftwareValue";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export default function LeaderboardPage() {
  const [contributors, setContributors] = useState<TopContributorEntry[]>([]);
  const [organizations, setOrganizations] = useState<TopOrganizationEntry[]>([]);
  const [repositories, setRepositories] = useState<ActiveRepositoryEntry[]>([]);
  const [indexData, setIndexData] = useState<OpenSourceIndexResponse>({ byStack: [], byIndustry: [], bySoftwareValue: [] });
  const [collections, setCollections] = useState<CollectionEntry[]>([]);
  const [activeIndexTab, setActiveIndexTab] = useState<IndexTab>("byStack");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([getTopContributors(), getTopOrganizations(), getActiveRepositories(), getOpenSourceIndex(), getCollections()])
      .then(([contributorData, organizationData, repositoryData, indexResponse, collectionData]) => {
        setContributors(contributorData);
        setOrganizations(organizationData);
        setRepositories(repositoryData);
        setIndexData(indexResponse);
        setCollections(collectionData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load leaderboards."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const contributorRows: RankingRow[] = useMemo(
    () =>
      contributors.map((entry) => ({
        id: entry.id,
        label: entry.name,
        sublabel: `@${entry.username}`,
        avatarUrl: entry.avatarUrl,
        value: compact.format(entry.contributions),
        href: `/profile/${entry.username}`
      })),
    [contributors]
  );
  const organizationRows: RankingRow[] = useMemo(
    () =>
      organizations.map((entry) => ({
        id: entry.id,
        label: entry.name,
        avatarUrl: entry.logoUrl,
        value: compact.format(entry.contributions),
        href: `/explore/organizations/${entry.slug}`
      })),
    [organizations]
  );
  const repositoryRows: RankingRow[] = useMemo(
    () =>
      repositories.map((entry) => ({
        id: entry.id,
        label: entry.name,
        sublabel: entry.organization.name,
        avatarUrl: entry.logoUrl,
        value: compact.format(entry.uniqueContributors),
        href: `/repos/${entry.organization.slug}/${entry.slug}`
      })),
    [repositories]
  );

  const activeIndexItems = indexData[activeIndexTab];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-ink">Leaderboards</h1>
          <p className="mt-3 text-base font-medium text-slate-500">Compare open-source organizations and contributors across key performance metrics.</p>
        </div>
        <Button href="/coming-soon?feature=all-leaderboards" variant="secondary">
          <Grid2X2 size={16} />
          View all leaderboards
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button type="button" variant="secondary" onClick={load}>
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-6 2xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-lg border border-line bg-white" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 2xl:grid-cols-3">
          <LeaderboardCard title="Top Contributors" description="Ranked by contributions over the last 12 months." icon={<Crown size={24} />} rows={contributorRows} valueLabel="Contributions (12M)" />
          <LeaderboardCard title="Top Organizations" description="Ranked by total contributions over the last 12 months." icon={<Database size={24} />} rows={organizationRows} valueLabel="Contributions (12M)" />
          <LeaderboardCard title="Most Active Repositories" description="Ranked by unique contributors over the last 12 months." icon={<Code2 size={24} />} rows={repositoryRows} valueLabel="Unique Contributors (12M)" />
        </div>
      )}

      <section className="grid gap-8 rounded-lg border border-line bg-white p-6 shadow-soft 2xl:grid-cols-[460px_1fr]">
        <div className="flex gap-6">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border border-moss/30 bg-moss/10 text-moss">
            <Layers3 size={32} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">The Maintainex Foundation</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">Open Source Index</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-500">Discover critical open-source stacks ranked by contributor volume from synced database activity.</p>
            <Button href="/coming-soon?feature=open-source-index" className="mt-6">
              Explore Open Source Index
            </Button>
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap gap-8 border-b border-line text-sm font-bold">
            <IndexTabButton active={activeIndexTab === "byStack"} onClick={() => setActiveIndexTab("byStack")}>
              By Stack
            </IndexTabButton>
            <IndexTabButton active={activeIndexTab === "byIndustry"} onClick={() => setActiveIndexTab("byIndustry")}>
              By Industry
            </IndexTabButton>
            <IndexTabButton active={activeIndexTab === "bySoftwareValue"} onClick={() => setActiveIndexTab("bySoftwareValue")}>
              By Software Value
            </IndexTabButton>
          </div>
          <div className="mt-6">
            {activeIndexItems.length ? <IndexBars items={activeIndexItems} /> : <EmptyState title="No index data available yet." description="Index bars will appear when synced activity can be grouped by stack, category, or repository technology." />}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-6 shadow-soft">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-moss">
              <Boxes size={26} />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-ink">Curated Collections</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Hand-picked collections from stored Maintainex collection data.</p>
            </div>
          </div>
          <Button href="/coming-soon?feature=collections" variant="ghost">
            View all collections
          </Button>
        </div>
        {collections.length ? (
          <div className="grid gap-6 xl:grid-cols-2 min-[1800px]:grid-cols-3">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        ) : (
          <EmptyState title="No collections available yet." description="Create collection rows in the database to populate this section." />
        )}
      </section>
    </div>
  );
}

function IndexTabButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={clsx("border-b-2 pb-2 transition", active ? "border-moss text-moss" : "border-transparent text-slate-400 hover:text-ink")}>
      {children}
    </button>
  );
}

function IndexBars({ items }: { items: OpenSourceIndexItem[] }) {
  const max = Math.max(...items.map((item) => item.contributors), 1);
  return (
    <div className="space-y-5">
      {items.slice(0, 5).map((item, index) => (
        <div key={item.name} className="grid items-center gap-4 md:grid-cols-[220px_1fr_auto]">
          <div className="flex items-center gap-3 text-sm font-bold text-ink">
            <span className="text-slate-400">{indexIcon(index)}</span>
            {item.name}
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-skyglass">
            <div className="h-full rounded-full bg-moss shadow-[0_0_18px_rgba(201,244,58,0.25)]" style={{ width: `${Math.max(8, (item.contributors / max) * 100)}%` }} />
          </div>
          <span className="text-sm font-semibold text-slate-500">{item.contributors.toLocaleString()} contributors</span>
        </div>
      ))}
    </div>
  );
}

function CollectionCard({ collection }: { collection: CollectionEntry }) {
  return (
    <article className="rounded-lg border border-line bg-[#111514] p-5">
      <div className="flex -space-x-2">
        {collection.logoUrls.slice(0, 5).map((url) => (
          <img key={url} src={url} alt="" className="h-9 w-9 rounded-full border border-line object-cover" />
        ))}
        {!collection.logoUrls.length ? <span className="grid h-9 w-9 place-items-center rounded-full border border-moss/30 bg-moss/10 text-xs font-black text-moss">{collection.title.slice(0, 1).toUpperCase()}</span> : null}
      </div>
      <h3 className="mt-5 text-lg font-extrabold text-ink">{collection.title}</h3>
      <p className="mt-3 line-clamp-3 min-h-[3.75rem] text-sm font-medium leading-5 text-slate-500">{collection.description}</p>
      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
        <span>{collection.itemCount.toLocaleString()} {collection.type.toLowerCase()}</span>
        <span>Updated {new Date(collection.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        <span className="ml-auto inline-flex items-center gap-1">
          <Heart size={14} />
          {collection.saveCount.toLocaleString()}
        </span>
      </div>
    </article>
  );
}

function indexIcon(index: number) {
  const icons = [<Cloud key="cloud" size={18} />, <Code2 key="code" size={18} />, <Layers3 key="layers" size={18} />, <Database key="database" size={18} />];
  return icons[index % icons.length];
}
