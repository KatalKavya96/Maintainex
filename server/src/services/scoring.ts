type ActivityLike = {
  activityType?: string | null;
  date?: Date | string | null;
  title?: string | null;
};

type QuestLike = {
  isActive?: boolean | null;
};

export type RepositoryScoreInput = {
  activityScore?: number | null;
  beginnerFriendlyScore?: number | null;
  maintianexScore?: number | null;
  reviewSpeedScore?: number | null;
  stars?: number | null;
  forks?: number | null;
  watchers?: number | null;
  openIssues?: number | null;
  license?: string | null;
  description?: string | null;
  activities?: ActivityLike[];
  quests?: QuestLike[];
};

export type OrganizationScoreInput = {
  activityScore?: number | null;
  beginnerFriendlyScore?: number | null;
  maintianexScore?: number | null;
  reputationScore?: number | null;
  reviewSpeedScore?: number | null;
  repositories?: RepositoryScoreInput[];
  programParticipations?: unknown[];
  quests?: QuestLike[];
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const round = (value: number, decimals = 0) => Number(value.toFixed(decimals));

const recentActivityCount = (activities: ActivityLike[] = [], days = 90) => {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  return activities.filter((activity) => {
    if (!activity.date) return false;
    return new Date(activity.date).getTime() >= since;
  }).length;
};

export function calculateContributionPoints(contribution: { type?: string | null; activityType?: string | null; title?: string | null; state?: string | null }) {
  const type = String(contribution.type ?? contribution.activityType ?? "").toUpperCase();
  const title = String(contribution.title ?? "").toLowerCase();
  const state = String(contribution.state ?? "").toUpperCase();

  if (title.includes("security") || title.includes("performance")) return 90;
  if (title.includes("feature")) return 80;
  if (title.includes("bug") || title.includes("fix")) return 60;
  if (title.includes("ci") || title.includes("build")) return 55;
  if (title.includes("doc")) return state === "MERGED" || type.includes("MERGED") ? 35 : 15;
  if (type.includes("MERGED")) return 50;
  if (type.includes("PR_REVIEWED") || type.includes("REVIEW")) return 20;
  if (type.includes("PR_RAISED") || type.includes("PULL")) return 15;
  if (type.includes("ISSUE_CLOSED")) return 10;
  if (type.includes("ISSUE_RAISED") || type.includes("ISSUE")) return 5;
  if (type.includes("COMMENT")) return 2;
  return 1;
}

export function calculateActivityScore(activity: { activityScore?: number | null; activities?: ActivityLike[] }) {
  if (activity.activityScore && activity.activityScore > 0) return clamp(activity.activityScore);
  const recent = recentActivityCount(activity.activities);
  const all = activity.activities?.length ?? 0;
  return clamp(recent * 7 + Math.min(all, 50));
}

export function calculateReputationScore(stars = 0, forks = 0, contributors = 0) {
  return clamp(Math.log10(stars + 1) * 22 + Math.log10(forks + 1) * 16 + Math.min(contributors, 100) * 0.25);
}

export function calculateBeginnerFriendlyScore(input: RepositoryScoreInput | OrganizationScoreInput) {
  if (input.beginnerFriendlyScore && input.beginnerFriendlyScore > 0) return clamp(input.beginnerFriendlyScore, 0, 5);

  const repositories = "repositories" in input ? input.repositories ?? [] : [input as RepositoryScoreInput];
  if (!repositories.length) return 0;

  const score = repositories.reduce((sum, repo) => {
    let value = 0;
    if ((repo.openIssues ?? 0) > 0) value += 1.2;
    if (repo.description) value += 0.9;
    if (repo.license) value += 0.8;
    if ((repo.quests ?? []).some((quest) => quest.isActive !== false)) value += 1.1;
    if ((repo.stars ?? 0) > 25) value += 0.5;
    return sum + clamp(value, 0, 5);
  }, 0);

  return round(score / repositories.length, 1);
}

export function calculateAverageReviewTime(prs: Array<{ openedAt?: Date | string | null; reviewedAt?: Date | string | null; mergedAt?: Date | string | null }> = []) {
  const durations = prs
    .map((pr) => {
      if (!pr.openedAt) return null;
      const end = pr.reviewedAt ?? pr.mergedAt;
      if (!end) return null;
      const diff = new Date(end).getTime() - new Date(pr.openedAt).getTime();
      return diff > 0 ? diff / (24 * 60 * 60 * 1000) : null;
    })
    .filter((value): value is number => typeof value === "number");

  if (!durations.length) return null;
  return round(durations.reduce((sum, value) => sum + value, 0) / durations.length, 1);
}

export function calculateRepositoryScore(repo: RepositoryScoreInput) {
  if (repo.maintianexScore && repo.maintianexScore > 0) return clamp(repo.maintianexScore);

  const recentActivity = calculateActivityScore(repo) * 0.25;
  const reviewSpeed = clamp(repo.reviewSpeedScore ?? 0) * 0.2;
  const beginner = calculateBeginnerFriendlyScore(repo) * 20 * 0.2;
  const reputation = calculateReputationScore(repo.stars ?? 0, repo.forks ?? 0, 0) * 0.15;
  const documentation = (repo.description ? 6 : 0) + (repo.license ? 4 : 0);
  const questAvailability = (repo.quests ?? []).some((quest) => quest.isActive !== false) ? 10 : 0;

  return round(clamp(recentActivity + reviewSpeed + beginner + reputation + documentation + questAvailability));
}

export function calculateOrganizationScore(org: OrganizationScoreInput) {
  if (org.maintianexScore && org.maintianexScore > 0) {
    return {
      maintianexScore: clamp(org.maintianexScore),
      scoreBreakdown: {
        repoActivity: 0,
        beginnerFriendliness: 0,
        reviewSpeed: 0,
        reputation: 0,
        programCredibility: 0,
        questAvailability: 0
      }
    };
  }

  const repositories = org.repositories ?? [];
  const repoActivityRaw = repositories.length
    ? repositories.reduce((sum, repo) => sum + calculateActivityScore(repo), 0) / repositories.length
    : calculateActivityScore(org);
  const repoActivity = repoActivityRaw * 0.25;
  const beginnerFriendliness = calculateBeginnerFriendlyScore(org) * 20 * 0.2;
  const reviewSpeed = clamp(org.reviewSpeedScore ?? 0) * 0.2;
  const reputationRaw = org.reputationScore && org.reputationScore > 0
    ? org.reputationScore
    : repositories.reduce((sum, repo) => sum + calculateReputationScore(repo.stars ?? 0, repo.forks ?? 0, 0), 0) / Math.max(repositories.length, 1);
  const reputation = reputationRaw * 0.15;
  const programCredibility = clamp((org.programParticipations?.length ?? 0) * 18, 0, 100) * 0.1;
  const questAvailability = clamp((org.quests ?? []).filter((quest) => quest.isActive !== false).length * 20, 0, 100) * 0.1;

  const scoreBreakdown = {
    repoActivity: round(repoActivity),
    beginnerFriendliness: round(beginnerFriendliness),
    reviewSpeed: round(reviewSpeed),
    reputation: round(reputation),
    programCredibility: round(programCredibility),
    questAvailability: round(questAvailability)
  };

  return {
    maintianexScore: round(clamp(Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0))),
    scoreBreakdown
  };
}
