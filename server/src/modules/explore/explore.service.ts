import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { calculateBeginnerFriendlyScore, calculateContributionPoints, calculateOrganizationScore, calculateRepositoryScore } from "../../services/scoring";
import { ApiError } from "../../utils/ApiError";

const organizationInclude = {
  programParticipations: true,
  repositories: {
    include: {
      activities: {
        select: {
          id: true,
          userId: true,
          date: true,
          activityType: true,
          title: true,
          status: true
        }
      },
      quests: true
    }
  },
  activities: {
    select: {
      id: true,
      userId: true,
      date: true,
      activityType: true,
      title: true,
      status: true,
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
          mainOrganizations: true
        }
      }
    }
  },
  quests: {
    include: {
      repository: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  }
} satisfies Prisma.OrganizationInclude;

type OrganizationWithExploreData = Prisma.OrganizationGetPayload<{ include: typeof organizationInclude }>;

type QueryValue = string | string[] | undefined;
type ExploreQuery = Record<string, QueryValue>;

const numberOrNull = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const firstQueryValue = (value: QueryValue) => (Array.isArray(value) ? value[0] : value);
const normalize = (value: QueryValue) => String(firstQueryValue(value) ?? "").trim();
const normalizeLower = (value: QueryValue) => normalize(value).toLowerCase();

const jsonStringArray = (value: Prisma.JsonValue | null | undefined) => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
};

const unique = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

const orgSlug = (organization: Pick<OrganizationWithExploreData, "id" | "name" | "slug">) => organization.slug || `${slugify(organization.name)}-${organization.id}` || organization.id;
const repoSlug = (repository: { id: string; name: string; slug?: string | null }) => repository.slug || slugify(repository.name) || repository.id;

const scoreLabel = (score: number) => {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Great";
  if (score >= 60) return "Good";
  if (score > 0) return "Emerging";
  return "No data";
};

const averageReviewTimeDays = (score?: number | null) => {
  if (!score || score <= 0) return null;
  return Number(Math.max(0.5, 6 - score / 20).toFixed(1));
};

const technologyStack = (organization: OrganizationWithExploreData) =>
  unique([
    ...jsonStringArray(organization.techStack),
    ...organization.repositories.flatMap((repository) => [
      ...jsonStringArray(repository.techStack),
      repository.primaryLanguage ?? "",
      repository.primaryTechStack ?? ""
    ])
  ]);

const topRepository = (organization: OrganizationWithExploreData) => {
  const [repository] = [...organization.repositories].sort((a, b) => {
    const bScore = (b.stars ?? 0) + (b.forks ?? 0) + b.activities.length * 8 + (b.maintianexScore ?? 0);
    const aScore = (a.stars ?? 0) + (a.forks ?? 0) + a.activities.length * 8 + (a.maintianexScore ?? 0);
    return bScore - aScore;
  });
  if (!repository) return null;
  return {
    id: repository.id,
    name: repository.name,
    slug: repoSlug(repository)
  };
};

const groupedPrograms = (organization: OrganizationWithExploreData) => {
  const groups = new Map<string, { name: string; years: number[]; sourceUrl?: string }>();
  organization.programParticipations.forEach((program) => {
    const existing = groups.get(program.programName) ?? { name: program.programName, years: [], sourceUrl: program.sourceUrl ?? undefined };
    existing.years.push(program.year);
    existing.sourceUrl ||= program.sourceUrl ?? undefined;
    groups.set(program.programName, existing);
  });

  return Array.from(groups.values()).map((program) => ({
    ...program,
    years: Array.from(new Set(program.years)).sort((a, b) => b - a)
  }));
};

const mapRepository = (repository: OrganizationWithExploreData["repositories"][number]) => {
  const score = calculateRepositoryScore(repository);
  return {
    id: repository.id,
    name: repository.name,
    slug: repoSlug(repository),
    fullName: repository.fullName,
    githubUrl: repository.githubUrl,
    description: repository.description,
    primaryLanguage: repository.primaryLanguage ?? repository.primaryTechStack,
    license: repository.license,
    stars: repository.stars,
    forks: repository.forks,
    watchers: repository.watchers,
    openIssues: repository.openIssues,
    techStack: unique([...jsonStringArray(repository.techStack), repository.primaryLanguage ?? "", repository.primaryTechStack ?? ""]),
    activityScore: repository.activityScore,
    difficultyScore: repository.difficultyScore,
    beginnerFriendlyScore: calculateBeginnerFriendlyScore(repository),
    maintianexScore: score,
    scoreLabel: scoreLabel(score),
    activeQuestCount: repository.quests.filter((quest) => quest.isActive).length
  };
};

const mapOrganization = (organization: OrganizationWithExploreData, savedOrganizationIds: Set<string>) => {
  const calculated = calculateOrganizationScore(organization);
  const score = calculated.maintianexScore;
  return {
    id: organization.id,
    name: organization.name,
    slug: orgSlug(organization),
    logoUrl: organization.logoUrl,
    description: organization.description,
    websiteUrl: organization.websiteUrl ?? organization.website,
    githubUrl: organization.githubUrl,
    programs: groupedPrograms(organization),
    techStack: technologyStack(organization),
    category: organization.category,
    maintianexScore: score,
    scoreLabel: scoreLabel(score),
    scoreBreakdown: calculated.scoreBreakdown,
    activeReposCount: organization.repositories.filter((repository) => repository.isActive).length,
    openQuestsCount: organization.quests.filter((quest) => quest.isActive).length,
    averageReviewTimeDays: averageReviewTimeDays(organization.reviewSpeedScore),
    topRepository: topRepository(organization),
    beginnerFriendlyScore: calculateBeginnerFriendlyScore(organization),
    isSaved: savedOrganizationIds.has(organization.id)
  };
};

const currentStreak = (activities: Array<{ date: Date }>) => {
  const days = new Set(activities.map((activity) => activity.date.toISOString().slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export class ExploreService {
  async listOrganizations(currentUserId: string, query: ExploreQuery) {
    const organizations = await prisma.organization.findMany({
      include: organizationInclude,
      orderBy: { updatedAt: "desc" }
    });
    const savedOrganizationIds = await this.savedOrganizationIds(currentUserId);

    const search = normalizeLower(query.search);
    const program = normalizeLower(query.program);
    const year = normalizeLower(query.year);
    const techStack = normalizeLower(query.techStack);
    const category = normalizeLower(query.category);
    const beginnerFriendly = numberOrNull(firstQueryValue(query.beginnerFriendly));
    const sort = normalizeLower(query.sort);

    let filtered = organizations.filter((organization) => {
      const mappedTechStack = technologyStack(organization);
      const programs = groupedPrograms(organization);

      if (search) {
        const haystack = [
          organization.name,
          organization.description ?? "",
          organization.category ?? "",
          ...mappedTechStack,
          ...organization.repositories.map((repository) => repository.name)
        ].join(" ").toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      if (program && program !== "all" && !programs.some((item) => item.name.toLowerCase() === program)) return false;
      if (year && year !== "all" && year !== "all years") {
        const matchesYear = programs.some((item) =>
          item.years.some((programYear) => (year.includes("earlier") || year === "2022-earlier" ? programYear <= 2022 : String(programYear) === year))
        );
        if (!matchesYear) return false;
      }
      if (techStack && techStack !== "all" && !mappedTechStack.some((item) => item.toLowerCase() === techStack)) return false;
      if (category && category !== "all" && category !== "all categories" && organization.category?.toLowerCase() !== category) return false;
      if (beginnerFriendly !== null && calculateBeginnerFriendlyScore(organization) < beginnerFriendly) return false;

      return true;
    });

    filtered = this.sortOrganizations(filtered, sort);

    const page = Math.max(1, numberOrNull(firstQueryValue(query.page)) ?? 1);
    const limit = Math.min(24, Math.max(1, numberOrNull(firstQueryValue(query.limit)) ?? 6));
    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit).map((organization) => mapOrganization(organization, savedOrganizationIds));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    };
  }

  async getOrganization(currentUserId: string, slug: string) {
    const organization = await this.organizationBySlug(slug);
    const savedOrganizationIds = await this.savedOrganizationIds(currentUserId);
    return mapOrganization(organization, savedOrganizationIds);
  }

  async contributors(slug: string) {
    const organization = await this.organizationBySlug(slug);
    const completedQuests = await prisma.userQuest.findMany({
      where: {
        status: "COMPLETED",
        quest: {
          organizationId: organization.id
        }
      },
      select: {
        userId: true
      }
    });
    const completedByUser = completedQuests.reduce<Record<string, number>>((acc, quest) => {
      acc[quest.userId] = (acc[quest.userId] ?? 0) + 1;
      return acc;
    }, {});
    const maintainerIds = new Set([organization.userId, ...organization.repositories.map((repository) => repository.userId)]);
    const contributors = new Map<string, {
      id: string;
      name: string;
      username: string;
      avatarUrl?: string | null;
      activities: Array<{ date: Date; activityType: string; title: string }>;
      totalContribution: number;
    }>();

    organization.activities.forEach((activity) => {
      const existing = contributors.get(activity.userId) ?? {
        id: activity.user.id,
        name: activity.user.name,
        username: activity.user.username,
        avatarUrl: activity.user.avatarUrl,
        activities: [],
        totalContribution: 0
      };
      existing.activities.push({
        date: activity.date,
        activityType: activity.activityType,
        title: activity.title
      });
      existing.totalContribution += calculateContributionPoints(activity);
      contributors.set(activity.userId, existing);
    });

    const rows = Array.from(contributors.values()).sort((a, b) => b.totalContribution - a.totalContribution);
    const totalContribution = rows.reduce((sum, contributor) => sum + contributor.totalContribution, 0);
    const table = rows.map((contributor, index) => ({
      rank: index + 1,
      user: {
        id: contributor.id,
        name: contributor.name,
        username: contributor.username,
        avatarUrl: contributor.avatarUrl
      },
      role: maintainerIds.has(contributor.id) ? "Maintainer" : "Contributor",
      totalContribution: contributor.totalContribution,
      contributionPercentage: totalContribution ? Math.round((contributor.totalContribution / totalContribution) * 100) : 0,
      questsCompleted: completedByUser[contributor.id] ?? 0,
      currentStreak: currentStreak(contributor.activities)
    }));

    return {
      items: table,
      totalContribution,
      topContributor: table[0] ?? null,
      distribution: this.contributionDistribution(organization.activities)
    };
  }

  async repositories(slug: string) {
    const organization = await this.organizationBySlug(slug);
    return {
      items: organization.repositories.map(mapRepository).sort((a, b) => b.maintianexScore - a.maintianexScore)
    };
  }

  async quests(slug: string) {
    const organization = await this.organizationBySlug(slug);
    return {
      items: organization.quests
        .filter((quest) => quest.isActive)
        .map((quest) => ({
          id: quest.id,
          title: quest.title,
          description: quest.description,
          type: quest.type,
          difficulty: quest.difficulty,
          points: quest.points,
          repository: quest.repository
            ? {
                id: quest.repository.id,
                name: quest.repository.name,
                slug: repoSlug(quest.repository)
              }
            : null
        }))
    };
  }

  async toggleSavedOpportunity(currentUserId: string, payload: { type?: string; organizationId?: string; repositoryId?: string; questId?: string; externalUrl?: string }) {
    if (currentUserId === "viewer") throw new ApiError(401, "Sign in to save opportunities.");
    const type = String(payload.type ?? "").toUpperCase();
    if (!type) throw new ApiError(400, "Saved opportunity type is required.");

    const data = {
      userId: currentUserId,
      type,
      organizationId: payload.organizationId ?? null,
      repositoryId: payload.repositoryId ?? null,
      questId: payload.questId ?? null,
      externalUrl: payload.externalUrl ?? null
    };

    await this.ensureSaveTargetExists(data);
    const existing = await prisma.savedOpportunity.findFirst({ where: data });
    if (existing) {
      await prisma.savedOpportunity.delete({ where: { id: existing.id } });
      return { saved: false };
    }

    const saved = await prisma.savedOpportunity.create({ data });
    return { saved: true, item: saved };
  }

  async savedOpportunities(currentUserId: string) {
    if (currentUserId === "viewer") {
      return { organizations: [], repositories: [], quests: [], issues: [] };
    }

    const saved = await prisma.savedOpportunity.findMany({
      where: { userId: currentUserId },
      include: {
        organization: { include: organizationInclude },
        repository: { include: { organization: true, activities: true, quests: true } },
        quest: { include: { organization: true, repository: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    const savedOrganizationIds = new Set(saved.map((item) => item.organizationId).filter((id): id is string => Boolean(id)));

    return {
      organizations: saved
        .filter((item) => item.type === "ORGANIZATION" && item.organization)
        .map((item) => mapOrganization(item.organization!, savedOrganizationIds)),
      repositories: saved
        .filter((item) => item.type === "REPOSITORY" && item.repository)
        .map((item) => ({
          ...mapRepository(item.repository!),
          organization: item.repository!.organization
            ? {
                id: item.repository!.organization.id,
                name: item.repository!.organization.name,
                slug: orgSlug(item.repository!.organization)
              }
            : null
        })),
      quests: saved
        .filter((item) => item.type === "QUEST" && item.quest)
        .map((item) => ({
          id: item.quest!.id,
          title: item.quest!.title,
          description: item.quest!.description,
          type: item.quest!.type,
          difficulty: item.quest!.difficulty,
          points: item.quest!.points,
          organization: {
            id: item.quest!.organization.id,
            name: item.quest!.organization.name,
            slug: orgSlug(item.quest!.organization)
          },
          repository: item.quest!.repository
            ? {
                id: item.quest!.repository.id,
                name: item.quest!.repository.name,
                slug: repoSlug(item.quest!.repository)
              }
            : null
        })),
      issues: saved.filter((item) => item.type === "ISSUE").map((item) => ({ id: item.id, externalUrl: item.externalUrl, createdAt: item.createdAt }))
    };
  }

  private sortOrganizations(organizations: OrganizationWithExploreData[], sort: string) {
    const mappedScore = (organization: OrganizationWithExploreData) => calculateOrganizationScore(organization).maintianexScore;
    const reviewSpeed = (organization: OrganizationWithExploreData) => organization.reviewSpeedScore || 0;
    const reputation = (organization: OrganizationWithExploreData) => organization.reputationScore || organization.repositories.reduce((sum, repo) => sum + (repo.stars ?? 0) + (repo.forks ?? 0), 0);

    return [...organizations].sort((a, b) => {
      if (sort.includes("active")) return b.repositories.filter((repo) => repo.isActive).length - a.repositories.filter((repo) => repo.isActive).length;
      if (sort.includes("review")) return reviewSpeed(b) - reviewSpeed(a);
      if (sort.includes("quest")) return b.quests.filter((quest) => quest.isActive).length - a.quests.filter((quest) => quest.isActive).length;
      if (sort.includes("reputation")) return reputation(b) - reputation(a);
      if (sort.includes("beginner")) return calculateBeginnerFriendlyScore(b) - calculateBeginnerFriendlyScore(a);
      return mappedScore(b) - mappedScore(a);
    });
  }

  private async organizationBySlug(slug: string) {
    const organization = await prisma.organization.findFirst({
      where: {
        OR: [{ slug }, { id: slug }]
      },
      include: organizationInclude
    });
    if (organization) return organization;

    const organizations = await prisma.organization.findMany({ include: organizationInclude });
    const matched = organizations.find((item) => orgSlug(item) === slug || slugify(item.name) === slug);
    if (!matched) throw new ApiError(404, "Organization not found");
    return matched;
  }

  private async savedOrganizationIds(currentUserId: string) {
    if (currentUserId === "viewer") return new Set<string>();
    const saved = await prisma.savedOpportunity.findMany({
      where: {
        userId: currentUserId,
        type: "ORGANIZATION",
        organizationId: { not: null }
      },
      select: { organizationId: true }
    });
    return new Set(saved.map((item) => item.organizationId).filter((id): id is string => Boolean(id)));
  }

  private contributionDistribution(activities: OrganizationWithExploreData["activities"]) {
    const buckets = {
      Code: 0,
      Documentation: 0,
      Community: 0,
      Other: 0
    };

    activities.forEach((activity) => {
      const title = activity.title.toLowerCase();
      if (title.includes("doc")) buckets.Documentation += calculateContributionPoints(activity);
      else if (activity.activityType === "COMMENTED" || activity.activityType === "ISSUE_RAISED") buckets.Community += calculateContributionPoints(activity);
      else if (activity.activityType === "OTHER") buckets.Other += calculateContributionPoints(activity);
      else buckets.Code += calculateContributionPoints(activity);
    });

    const total = Object.values(buckets).reduce((sum, value) => sum + value, 0);
    return Object.entries(buckets)
      .filter(([, value]) => value > 0)
      .map(([label, value]) => ({
        label,
        value,
        percentage: total ? Math.round((value / total) * 100) : 0
      }));
  }

  private async ensureSaveTargetExists(data: { type: string; organizationId: string | null; repositoryId: string | null; questId: string | null; externalUrl: string | null }) {
    if (data.type === "ORGANIZATION") {
      if (!data.organizationId) throw new ApiError(400, "organizationId is required.");
      const organization = await prisma.organization.findUnique({ where: { id: data.organizationId }, select: { id: true } });
      if (!organization) throw new ApiError(404, "Organization not found");
    }
    if (data.type === "REPOSITORY") {
      if (!data.repositoryId) throw new ApiError(400, "repositoryId is required.");
      const repository = await prisma.repository.findUnique({ where: { id: data.repositoryId }, select: { id: true } });
      if (!repository) throw new ApiError(404, "Repository not found");
    }
    if (data.type === "QUEST") {
      if (!data.questId) throw new ApiError(400, "questId is required.");
      const quest = await prisma.quest.findUnique({ where: { id: data.questId }, select: { id: true } });
      if (!quest) throw new ApiError(404, "Quest not found");
    }
    if (data.type === "ISSUE" && !data.externalUrl) throw new ApiError(400, "externalUrl is required.");
  }
}
