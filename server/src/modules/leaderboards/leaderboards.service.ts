import { prisma } from "../../config/database";
import { calculateContributionPoints, calculateOrganizationScore, calculateRepositoryScore } from "../../services/scoring";
import { slugify } from "../explore/explore.service";

const twelveMonthsAgo = () => {
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  return start;
};

const repoSlug = (repository: { id: string; name: string; slug?: string | null }) => repository.slug || slugify(repository.name) || repository.id;
const orgSlug = (organization: { id: string; name: string; slug?: string | null }) => organization.slug || `${slugify(organization.name)}-${organization.id}` || organization.id;

const jsonStringArray = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
};

export class LeaderboardsService {
  async topContributors() {
    const start = twelveMonthsAgo();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        activities: {
          where: { date: { gte: start } },
          select: {
            activityType: true,
            title: true,
            status: true
          }
        }
      }
    });

    return users
      .map((user) => ({
        id: user.id,
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
        contributions: user.activities.reduce((sum, activity) => sum + calculateContributionPoints(activity), 0)
      }))
      .filter((user) => user.contributions > 0)
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, 10);
  }

  async topOrganizations() {
    const start = twelveMonthsAgo();
    const organizations = await prisma.organization.findMany({
      include: {
        programParticipations: true,
        quests: true,
        repositories: {
          include: {
            activities: {
              where: { date: { gte: start } },
              select: { activityType: true, title: true, status: true }
            },
            quests: true
          }
        },
        activities: {
          where: { date: { gte: start } },
          select: { activityType: true, title: true, status: true }
        }
      }
    });

    return organizations
      .map((organization) => ({
        id: organization.id,
        name: organization.name,
        slug: orgSlug(organization),
        logoUrl: organization.logoUrl,
        maintianexScore: calculateOrganizationScore(organization).maintianexScore,
        contributions: organization.activities.reduce((sum, activity) => sum + calculateContributionPoints(activity), 0)
      }))
      .filter((organization) => organization.contributions > 0)
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, 10);
  }

  async activeRepositories() {
    const start = twelveMonthsAgo();
    const repositories = await prisma.repository.findMany({
      include: {
        organization: true,
        quests: true,
        activities: {
          where: { date: { gte: start } },
          select: {
            userId: true,
            activityType: true,
            title: true,
            status: true
          }
        }
      }
    });

    return repositories
      .map((repository) => ({
        id: repository.id,
        name: repository.name,
        slug: repoSlug(repository),
        fullName: repository.fullName,
        logoUrl: repository.organization.logoUrl,
        organization: {
          id: repository.organization.id,
          name: repository.organization.name,
          slug: orgSlug(repository.organization)
        },
        maintianexScore: calculateRepositoryScore(repository),
        uniqueContributors: new Set(repository.activities.map((activity) => activity.userId)).size,
        contributions: repository.activities.reduce((sum, activity) => sum + calculateContributionPoints(activity), 0)
      }))
      .filter((repository) => repository.uniqueContributors > 0)
      .sort((a, b) => b.uniqueContributors - a.uniqueContributors || b.contributions - a.contributions)
      .slice(0, 10);
  }

  async openSourceIndex() {
    const organizations = await prisma.organization.findMany({
      include: {
        activities: {
          select: { userId: true }
        },
        repositories: {
          include: {
            activities: {
              select: { userId: true }
            }
          }
        }
      }
    });

    const byStack = new Map<string, Set<string>>();
    const byIndustry = new Map<string, Set<string>>();
    const bySoftwareValue = new Map<string, Set<string>>();

    organizations.forEach((organization) => {
      const orgContributors = new Set([
        ...organization.activities.map((activity) => activity.userId),
        ...organization.repositories.flatMap((repository) => repository.activities.map((activity) => activity.userId))
      ]);
      const stacks = [
        ...jsonStringArray(organization.techStack),
        ...organization.repositories.flatMap((repository) => [
          ...jsonStringArray(repository.techStack),
          repository.primaryLanguage ?? "",
          repository.primaryTechStack ?? ""
        ])
      ].filter(Boolean);

      stacks.forEach((stack) => this.addContributors(byStack, stack, orgContributors));
      if (organization.category) this.addContributors(byIndustry, organization.category, orgContributors);
      organization.repositories.forEach((repository) => {
        const repoContributors = new Set(repository.activities.map((activity) => activity.userId));
        const label = repository.primaryLanguage ?? repository.primaryTechStack ?? organization.category;
        if (label) this.addContributors(bySoftwareValue, label, repoContributors);
      });
    });

    return {
      byStack: this.indexItems(byStack),
      byIndustry: this.indexItems(byIndustry),
      bySoftwareValue: this.indexItems(bySoftwareValue)
    };
  }

  async collections() {
    const collections = await prisma.collection.findMany({ orderBy: { updatedAt: "desc" }, take: 12 });
    return collections.map((collection) => ({
      id: collection.id,
      title: collection.title,
      description: collection.description,
      type: collection.type,
      itemCount: collection.itemCount,
      logoUrls: jsonStringArray(collection.logoUrls),
      saveCount: collection.saveCount,
      updatedAt: collection.updatedAt
    }));
  }

  private addContributors(map: Map<string, Set<string>>, key: string, contributors: Set<string>) {
    const existing = map.get(key) ?? new Set<string>();
    contributors.forEach((contributor) => existing.add(contributor));
    map.set(key, existing);
  }

  private indexItems(map: Map<string, Set<string>>) {
    return Array.from(map.entries())
      .map(([name, contributors]) => ({
        name,
        contributors: contributors.size
      }))
      .filter((item) => item.contributors > 0)
      .sort((a, b) => b.contributors - a.contributors)
      .slice(0, 8);
  }
}
