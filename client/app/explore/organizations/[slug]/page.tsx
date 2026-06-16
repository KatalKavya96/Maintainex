"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, ExternalLink, Flame, Heart, Info, Rocket, Share2, Star, UserPlus } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/common/Button";
import { EmptyState, MetricCard } from "@/components/common/MetricCard";
import { ProgramBadge } from "@/components/common/ProgramBadge";
import { ScoreBadge } from "@/components/common/ScoreBadge";
import { TechTag } from "@/components/common/TechTag";
import { QuestCard } from "@/components/explore/QuestCard";
import { RepositoryCard } from "@/components/explore/RepositoryCard";
import { getExploreOrganization, getExploreOrganizationContributors, getExploreOrganizationQuests, getExploreOrganizationRepositories, toggleSavedOpportunity } from "@/lib/api";
import type { ExploreOrganization, OrganizationContributorsResponse, OrganizationQuestsResponse, OrganizationRepositoriesResponse } from "@/types/explore";

const tabs = ["Overview", "Contributors", "Repositories", "Quests", "Leaderboards"] as const;
type Tab = (typeof tabs)[number];

const ratingStars = (score: number) =>
  Array.from({ length: 5 }, (_, index) => <Star key={index} size={18} className={index < Math.round(score || 0) ? "fill-moss text-moss" : "text-slate-600"} />);

export default function OrganizationDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [activeTab, setActiveTab] = useState<Tab>("Contributors");
  const [organization, setOrganization] = useState<ExploreOrganization | null>(null);
  const [contributors, setContributors] = useState<OrganizationContributorsResponse | null>(null);
  const [repositories, setRepositories] = useState<OrganizationRepositoriesResponse | null>(null);
  const [quests, setQuests] = useState<OrganizationQuestsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!slug) return;
    setLoading(true);
    setError("");
    Promise.all([
      getExploreOrganization(slug),
      getExploreOrganizationContributors(slug),
      getExploreOrganizationRepositories(slug),
      getExploreOrganizationQuests(slug)
    ])
      .then(([orgData, contributorData, repositoryData, questData]) => {
        setOrganization(orgData);
        setContributors(contributorData);
        setRepositories(repositoryData);
        setQuests(questData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load organization."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [slug]);

  async function saveOrganization() {
    if (!organization) return;
    setSaving(true);
    setError("");
    try {
      const result = await toggleSavedOpportunity({ type: "ORGANIZATION", organizationId: organization.id });
      setOrganization({ ...organization, isSaved: result.saved });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save organization.");
    } finally {
      setSaving(false);
    }
  }

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
    <div className="space-y-4">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-5">
          {organization.logoUrl ? (
            <img src={organization.logoUrl} alt="" className="h-28 w-28 rounded-full border border-line object-cover shadow-soft" />
          ) : (
            <div className="grid h-28 w-28 shrink-0 place-items-center rounded-full border border-moss/30 bg-moss/15 text-4xl font-black text-moss shadow-soft">
              {organization.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-3xl font-black tracking-tight text-ink">{organization.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {organization.programs.map((program) => (
                <ProgramBadge key={program.name} name={program.name} />
              ))}
            </div>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">{organization.description || "No organization description has been synced yet."}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {organization.techStack.slice(0, 6).map((tag) => (
                <TechTag key={tag}>{tag}</TechTag>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Maintainex Score" value={<span className="text-moss">{organization.maintianexScore || "--"}</span>} detail={organization.scoreLabel} icon={<Info size={15} />} />
          <MetricCard label="Active Repos" value={organization.activeReposCount} detail="tracked repositories" />
          <MetricCard label="Open Quests" value={organization.openQuestsCount} detail="available now" />
          <MetricCard label="Avg Review Time" value={organization.averageReviewTimeDays ? `${organization.averageReviewTimeDays}d` : "--"} detail="from synced review data" />
          <MetricCard
            label="Beginner Friendly"
            value={<span className="flex gap-1">{ratingStars(organization.beginnerFriendlyScore)}</span>}
            detail={`${organization.beginnerFriendlyScore ? organization.beginnerFriendlyScore.toFixed(1) : "--"}/5`}
          />
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <Button href="/coming-soon?feature=follow-organization" variant="secondary">
          <UserPlus size={16} />
          Follow
        </Button>
        <Button href="/coming-soon?feature=start-quest">
          <Rocket size={16} />
          Start Quest
        </Button>
        <Button type="button" variant="secondary" onClick={saveOrganization} disabled={saving}>
          <Heart size={16} className={organization.isSaved ? "fill-moss text-moss" : ""} />
          Save Org
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

      <section className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
        <div className="flex overflow-x-auto border-b border-line">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={clsx("h-12 px-5 text-sm font-bold transition", activeTab === tab ? "border-b-2 border-moss bg-moss/10 text-moss" : "text-slate-400 hover:text-ink")}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-3">
          {activeTab === "Overview" ? <OverviewTab organization={organization} repositories={topRepositories} /> : null}
          {activeTab === "Contributors" ? <ContributorsTab data={contributors} /> : null}
          {activeTab === "Repositories" ? <RepositoriesTab repositories={repositories?.items ?? []} orgSlug={organization.slug} /> : null}
          {activeTab === "Quests" ? <QuestsTab quests={quests?.items ?? []} /> : null}
          {activeTab === "Leaderboards" ? (
            <EmptyState title="Organization leaderboards are coming soon." description="This tab will show database-backed rank changes once leaderboard history exists." action={<Button href="/leaderboard">Open Global Leaderboards</Button>} />
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-ink">Top repositories</h2>
          <button type="button" onClick={() => setActiveTab("Repositories")} className="text-sm font-bold text-moss">
            View all repositories →
          </button>
        </div>
        {topRepositories.length ? (
          <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
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

function OverviewTab({ organization, repositories }: { organization: ExploreOrganization; repositories: OrganizationRepositoriesResponse["items"] }) {
  const breakdown = organization.scoreBreakdown ? Object.entries(organization.scoreBreakdown).filter(([, value]) => value > 0) : [];
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="rounded-lg border border-line bg-[#111514] p-4">
        <h2 className="text-lg font-extrabold text-ink">Score breakdown</h2>
        {breakdown.length ? (
          <div className="mt-4 space-y-3">
            {breakdown.map(([label, value]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-xs font-bold text-slate-400">
                  <span>{label.replace(/([A-Z])/g, " $1")}</span>
                  <span>{value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-skyglass">
                  <div className="h-full rounded-full bg-moss" style={{ width: `${Math.min(100, value * 4)}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No score explanation yet." description="Score breakdowns will appear once enough activity, repository, and program data exists." />
        )}
      </div>
      <div className="rounded-lg border border-line bg-[#111514] p-4">
        <ScoreBadge score={organization.maintianexScore} label={organization.scoreLabel} />
        <p className="mt-4 text-sm font-medium leading-6 text-slate-500">{repositories.length} top repositories are available from synced data.</p>
      </div>
    </div>
  );
}

function ContributorsTab({ data }: { data: OrganizationContributorsResponse | null }) {
  if (!data || data.items.length === 0) {
    return <EmptyState title="No contributors found yet." description="Contributor leaderboards will appear after activities are synced for this organization." />;
  }

  return (
    <div className="grid gap-3 xl:grid-cols-[1fr_360px]">
      <div className="overflow-hidden rounded-lg border border-line">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-[#111514] p-3">
          <button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-skyglass px-3 text-sm font-bold text-ink">
            All activities
          </button>
          <button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-skyglass px-3 text-sm font-bold text-ink">
            <CalendarDays size={15} />
            Past 365 days
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line bg-skyglass text-xs font-bold text-slate-400">
              <tr>
                <th className="px-4 py-3">Contributor</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Total Contribution</th>
                <th className="px-4 py-3">Quests Completed</th>
                <th className="px-4 py-3">Current Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.items.slice(0, 7).map((contributor) => (
                <tr key={contributor.user.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-slate-400">{contributor.rank}</span>
                      {contributor.user.avatarUrl ? (
                        <img src={contributor.user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-skyglass text-xs font-black text-moss">
                          {contributor.user.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className="font-bold text-ink">{contributor.user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded border border-moss/20 bg-moss/10 px-2 py-1 text-xs font-bold text-moss">{contributor.role}</span>
                  </td>
                  <td className="px-4 py-3 font-extrabold text-ink">
                    {contributor.totalContribution.toLocaleString()} <span className="ml-3 font-medium text-slate-500">{contributor.contributionPercentage}%</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{contributor.questsCompleted}</td>
                  <td className="px-4 py-3 text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Flame size={15} className="text-orange-400" />
                      {contributor.currentStreak} days
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ContributorSummary data={data} />
    </div>
  );
}

function ContributorSummary({ data }: { data: OrganizationContributorsResponse }) {
  const top = data.topContributor;
  const gradient = distributionGradient(data.distribution);
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-line bg-[#111514] p-4">
        <h3 className="text-sm font-extrabold text-ink">Top Contributor</h3>
        {top ? (
          <div className="mt-5 flex items-center gap-4">
            {top.user.avatarUrl ? (
              <img src={top.user.avatarUrl} alt="" className="h-20 w-20 rounded-full border border-moss/30 object-cover" />
            ) : (
              <span className="grid h-20 w-20 rounded-full border border-moss/30 bg-moss/10 place-items-center text-2xl font-black text-moss">{top.user.name.slice(0, 1).toUpperCase()}</span>
            )}
            <div>
              <p className="font-extrabold text-ink">{top.user.name}</p>
              <p className="mt-1 text-3xl font-black text-ink">{top.totalContribution.toLocaleString()}</p>
              <p className="text-sm font-semibold text-slate-500">{top.contributionPercentage}% of total contributions</p>
            </div>
          </div>
        ) : null}
      </div>
      <div className="rounded-lg border border-line bg-[#111514] p-4">
        <h3 className="text-sm font-extrabold text-ink">Contribution distribution</h3>
        {data.distribution.length ? (
          <div className="mt-5 grid items-center gap-5 sm:grid-cols-[140px_1fr]">
            <div className="h-32 w-32 rounded-full" style={{ background: gradient }}>
              <div className="grid h-full w-full place-items-center rounded-full">
                <div className="h-16 w-16 rounded-full bg-[#111514]" />
              </div>
            </div>
            <div className="space-y-3">
              {data.distribution.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-slate-400">{item.label}</span>
                  <span className="font-bold text-ink">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm font-semibold text-slate-500">No contribution distribution available yet.</p>
        )}
        <div className="mt-5 border-t border-line pt-4">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-slate-500">Total contributions</span>
            <span className="font-black text-ink">{data.totalContribution.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RepositoriesTab({ repositories, orgSlug }: { repositories: OrganizationRepositoriesResponse["items"]; orgSlug: string }) {
  if (!repositories.length) return <EmptyState title="No repositories synced yet." description="Repository cards will appear after GitHub repository data is stored in Maintainex." />;
  return (
    <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
      {repositories.map((repository) => (
        <RepositoryCard key={repository.id} repository={repository} orgSlug={orgSlug} />
      ))}
    </div>
  );
}

function QuestsTab({ quests }: { quests: OrganizationQuestsResponse["items"] }) {
  if (!quests.length) {
    return <EmptyState title="Quests are coming soon for this organization." description="No active quest rows exist yet, so Maintainex is not showing placeholder quests." action={<Button href="/coming-soon?feature=quests">Open Quests Roadmap</Button>} />;
  }
  return (
    <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
      {quests.map((quest) => (
        <QuestCard key={quest.id} quest={quest} />
      ))}
    </div>
  );
}

function distributionGradient(distribution: OrganizationContributorsResponse["distribution"]) {
  const colors = ["#c9f43a", "#5f8ef6", "#9b7cff", "#4bd4a1"];
  let cursor = 0;
  const stops = distribution.map((item, index) => {
    const start = cursor;
    cursor += item.percentage;
    return `${colors[index % colors.length]} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse rounded-lg border border-line bg-white p-6 shadow-soft">
        <div className="flex gap-5">
          <div className="h-28 w-28 rounded-full bg-skyglass" />
          <div className="flex-1 space-y-4">
            <div className="h-8 w-64 rounded bg-skyglass" />
            <div className="h-4 w-96 max-w-full rounded bg-skyglass" />
            <div className="h-4 w-80 max-w-full rounded bg-skyglass" />
          </div>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-lg bg-white" />
        <div className="h-64 animate-pulse rounded-lg bg-white" />
        <div className="h-64 animate-pulse rounded-lg bg-white" />
      </div>
    </div>
  );
}
