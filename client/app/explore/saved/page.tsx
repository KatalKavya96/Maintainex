"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/MetricCard";
import { OrganizationCard } from "@/components/explore/OrganizationCard";
import { QuestCard } from "@/components/explore/QuestCard";
import { RepositoryCard } from "@/components/explore/RepositoryCard";
import { getSavedOpportunities, toggleSavedOpportunity } from "@/lib/api";
import type { ExploreOrganization, SavedOpportunitiesResponse } from "@/types/explore";

export default function SavedOpportunitiesPage() {
  const [data, setData] = useState<SavedOpportunitiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    getSavedOpportunities()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load saved opportunities."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  async function unsaveOrganization(organization: ExploreOrganization) {
    setSavingId(organization.id);
    try {
      await toggleSavedOpportunity({ type: "ORGANIZATION", organizationId: organization.id });
      setData((current) => (current ? { ...current, organizations: current.organizations.filter((item) => item.id !== organization.id) } : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update saved organization.");
    } finally {
      setSavingId("");
    }
  }

  const empty = data && !data.organizations.length && !data.repositories.length && !data.quests.length && !data.issues.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-ink">Saved Opportunities</h1>
        <p className="mt-3 text-base font-medium text-slate-500">Your saved organizations, repositories, quests, and issue links from real Maintainex data.</p>
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
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-lg border border-line bg-white" />
          ))}
        </div>
      ) : null}

      {!loading && empty ? (
        <EmptyState
          title="No saved opportunities yet."
          description="Save organizations from Explore Organizations to build your personal contribution shortlist."
          action={<Button href="/explore/organizations">Explore Organizations</Button>}
        />
      ) : null}

      {!loading && data ? (
        <>
          <SavedSection title="Saved Organizations" empty="No saved organizations yet." count={data.organizations.length}>
            <div className="grid gap-6 xl:grid-cols-2 min-[1800px]:grid-cols-3">
              {data.organizations.map((organization) => (
                <OrganizationCard key={organization.id} organization={organization} onSave={unsaveOrganization} saving={savingId === organization.id} />
              ))}
            </div>
          </SavedSection>

          <SavedSection title="Saved Repositories" empty="No saved repositories yet." count={data.repositories.length}>
            <div className="grid gap-6 xl:grid-cols-2 min-[1800px]:grid-cols-3">
              {data.repositories.map((repository) => (
                <RepositoryCard key={repository.id} repository={repository} orgSlug={repository.organization?.slug} />
              ))}
            </div>
          </SavedSection>

          <SavedSection title="Saved Quests" empty="No saved quests yet." count={data.quests.length}>
            <div className="grid gap-6 xl:grid-cols-2 min-[1800px]:grid-cols-3">
              {data.quests.map((quest) => (
                <QuestCard key={quest.id} quest={quest} />
              ))}
            </div>
          </SavedSection>

          <SavedSection title="Saved Issues" empty="No saved issue links yet." count={data.issues.length}>
            <div className="grid gap-3 lg:grid-cols-2">
              {data.issues.map((issue) => (
                <a key={issue.id} href={issue.externalUrl ?? "#"} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white p-4 text-sm font-bold text-ink shadow-soft transition hover:border-moss">
                  <span className="truncate">{issue.externalUrl}</span>
                  <ExternalLink size={16} className="shrink-0 text-moss" />
                </a>
              ))}
            </div>
          </SavedSection>
        </>
      ) : null}
    </div>
  );
}

function SavedSection({ title, empty, count, children }: { title: string; empty: string; count: number; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white p-6 shadow-soft">
      <h2 className="text-xl font-extrabold text-ink">{title}</h2>
      <div className="mt-5">{count > 0 ? children : <EmptyState title={empty} description="Maintainex only shows saved items that exist in the database." />}</div>
    </section>
  );
}
