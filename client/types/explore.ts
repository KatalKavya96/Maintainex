export interface ProgramParticipation {
  name: string;
  years: number[];
  sourceUrl?: string;
}

export interface ExploreRepositorySummary {
  id: string;
  name: string;
  slug: string;
  fullName?: string | null;
  githubUrl?: string | null;
  description?: string | null;
  primaryLanguage?: string | null;
  license?: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  techStack: string[];
  activityScore: number;
  difficultyScore: number;
  beginnerFriendlyScore: number;
  maintianexScore: number;
  scoreLabel: string;
  activeQuestCount: number;
}

export interface ExploreOrganization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  websiteUrl?: string | null;
  githubUrl?: string | null;
  programs: ProgramParticipation[];
  techStack: string[];
  category?: string | null;
  maintianexScore: number;
  scoreLabel: string;
  scoreBreakdown?: Record<string, number>;
  activeReposCount: number;
  openQuestsCount: number;
  averageReviewTimeDays?: number | null;
  topRepository?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  beginnerFriendlyScore: number;
  isSaved: boolean;
}

export interface ExploreOrganizationsResponse {
  items: ExploreOrganization[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrganizationContributor {
  rank: number;
  user: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
  };
  role: "Maintainer" | "Contributor";
  totalContribution: number;
  contributionPercentage: number;
  questsCompleted: number;
  currentStreak: number;
}

export interface OrganizationContributorsResponse {
  items: OrganizationContributor[];
  totalContribution: number;
  topContributor: OrganizationContributor | null;
  distribution: Array<{
    label: string;
    value: number;
    percentage: number;
  }>;
}

export interface OrganizationRepositoriesResponse {
  items: ExploreRepositorySummary[];
}

export interface OrganizationQuestsResponse {
  items: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    difficulty: string;
    points: number;
    repository: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }>;
}

export interface SavedOpportunitiesResponse {
  organizations: ExploreOrganization[];
  repositories: Array<ExploreRepositorySummary & {
    organization: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }>;
  quests: OrganizationQuestsResponse["items"];
  issues: Array<{
    id: string;
    externalUrl?: string | null;
    createdAt: string;
  }>;
}
