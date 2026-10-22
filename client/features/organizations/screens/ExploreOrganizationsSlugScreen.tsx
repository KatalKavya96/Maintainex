"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ExternalLink, Info, Share2, Star, UserPlus } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/design-system/patterns/Button";
import { EmptyState, MetricCard } from "@/design-system/patterns/MetricCard";
import { ProgramBadge } from "@/design-system/patterns/ProgramBadge";

import { TechTag } from "@/design-system/patterns/TechTag";
import { RepositoryCard } from "@/features/organizations/components/RepositoryCard";
import { getExploreOrganization, getExploreOrganizationContributors, getExploreOrganizationRepositories } from "@/data/api/organizations";
import type { ExploreOrganization, OrganizationContributorsResponse, OrganizationRepositoriesResponse } from "@/types/explore";

import { OverviewTab } from "../components/OverviewTab";
import { ContributorsTab } from "../components/ContributorsTab";
import { RepositoriesTab } from "../components/RepositoriesTab";
import { DetailSkeleton } from "../components/DetailSkeleton";

const tabs = ["Overview", "Contributors", "Repositories"] as const;
type Tab = (typeof tabs)[number];

const ratingStars = (score: number) =>
  Array.from({ length: 5 }, (_, index) => <Star key={index} size={18} className={index < Math.round(score || 0) ? "fill-moss text-moss" : "text-muted"} />);

export default function OrganizationDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [organization, setOrganization] = useState<ExploreOrganization | null>(null);
  const [contributors, setContributors] = useState<OrganizationContributorsResponse | null>(null);
  const [repositories, setRepositories] = useState<OrganizationRepositoriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    if (!slug) return;
    setLoading(true);
    setError("");
    Promise.all([
      getExploreOrganization(slug),
      getExploreOrganizationContributors(slug),
      getExploreOrganizationRepositories(slug)
    ])
      .then(([orgData, contributorData, repositoryData]) => {
        setOrganization(orgData);
        setContributors(contributorData);
        setRepositories(repositoryData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load organization."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [slug]);

  const topRepositories = useMemo(() => repositories?.items.slice(0, 4) ?? [], [repositories]);

  if (loading) return <DetailSkeleton />;

  if (error || !organization) {
    return (
      <EmptyState
        title={error || "Organization not found."}
        description="Maintainex could not load this organization from the API."
        action={<Button onClick={load}>Retry</Button>}
      />
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-7 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="flex min-w-0 gap-6">
          {organization.logoUrl ? (
            <img src={organization.logoUrl} alt="" className="h-28 w-28 rounded-full border border-line object-cover shadow-soft" />
          ) : (
            <div className="grid h-28 w-28 shrink-0 place-items-center rounded-full border border-moss/30 bg-moss/15 text-4xl font-semibold text-moss shadow-soft">
              {organization.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-ink">{organization.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {organization.programs.map((program) => (
                <ProgramBadge key={program.name} name={program.name} />
              ))}
            </div>
            <p className="mt-4 max-w-3xl text-sm font-medium leading-6 text-muted">{organization.description || "No organization description has been synced yet."}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {organization.techStack.slice(0, 6).map((tag) => (
                <TechTag key={tag}>{tag}</TechTag>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-5">
          <MetricCard label="Maintainex Score" value={<span className="text-moss">{organization.maintianexScore || "--"}</span>} detail={organization.scoreLabel} icon={<Info size={15} />} />
          <MetricCard label="Active Repos" value={organization.activeReposCount} detail="tracked repositories" />
          <MetricCard label="Avg Review Time" value={organization.averageReviewTimeDays ? `${organization.averageReviewTimeDays}d` : "--"} detail="from synced review data" />
          <MetricCard
            label="Beginner Friendly"
            value={<span className="flex gap-1">{ratingStars(organization.beginnerFriendlyScore)}</span>}
            detail={`${organization.beginnerFriendlyScore ? organization.beginnerFriendlyScore.toFixed(1) : "--"}/5`}
          />
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-4">
        <Button href="/coming-soon?feature=follow-organization" variant="secondary">
          <UserPlus size={16} />
          Follow
        </Button>
        {organization.githubUrl ? (
          <Button href={organization.githubUrl} variant="secondary" target="_blank" rel="noreferrer" title="Open GitHub">
            <ExternalLink size={16} />
          </Button>
        ) : null}
        <Button href="/coming-soon?feature=share-organization" variant="secondary" title="Share">
          <Share2 size={16} />
        </Button>
      </div>

      <section className="overflow-hidden rounded-lg border border-line bg-panel shadow-soft">
        <div className="flex overflow-x-auto border-b border-line">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={clsx("h-14 px-6 text-sm font-bold transition", activeTab === tab ? "border-b-2 border-moss bg-moss/10 text-moss" : "text-muted hover:text-ink")}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === "Overview" ? <OverviewTab organization={organization} repositories={topRepositories} /> : null}
          {activeTab === "Contributors" ? <ContributorsTab data={contributors} /> : null}
          {activeTab === "Repositories" ? <RepositoriesTab repositories={repositories?.items ?? []} orgSlug={organization.slug} /> : null}

        </div>
      </section>

      <section className="rounded-lg border border-line bg-panel p-6 shadow-soft">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Top repositories</h2>
          <button type="button" onClick={() => setActiveTab("Repositories")} className="text-sm font-bold text-moss">
            View all repositories →
          </button>
        </div>
        {topRepositories.length ? (
          <div className="grid gap-5 xl:grid-cols-2 min-[1800px]:grid-cols-4">
            {topRepositories.map((repository) => (
              <RepositoryCard key={repository.id} repository={repository} orgSlug={organization.slug} />
            ))}
          </div>
        ) : (
          <EmptyState title="No repositories synced yet." description="Repository cards will appear here after GitHub repository data is stored in Maintainex." />
        )}
      </section>
    </div>
  );
}

