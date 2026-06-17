import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, type Prisma } from "@prisma/client";

type GsocProject = {
  title?: string;
  short_description?: string;
  description?: string;
  code_url?: string;
  project_url?: string;
};

type GsocYear = {
  projects_url?: string;
  num_projects?: number;
  projects?: GsocProject[];
};

type GsocOrganization = {
  name: string;
  url?: string;
  image_url?: string;
  description?: string;
  category?: string;
  topics?: string[];
  technologies?: string[];
  years?: Record<string, GsocYear>;
};

type GitHubRepo = {
  id: number;
  node_id?: string;
  name: string;
  full_name: string;
  html_url: string;
  description?: string | null;
  language?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  watchers_count?: number;
  open_issues_count?: number;
  license?: { spdx_id?: string; name?: string } | null;
  owner?: {
    login: string;
    id: number;
    node_id?: string;
    html_url?: string;
    avatar_url?: string;
  };
};

const prisma = new PrismaClient();
const apiUrl = "https://api.gsocorganizations.dev/organizations.json";
const source = "IMPORTED" as const;
const catalogEmail = "catalog@maintainex.local";
const catalogUsername = "maintainex-catalog";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...value] = arg.replace(/^--/, "").split("=");
    return [key, value.join("=") || "true"];
  })
);

const selectedYears = (args.get("years") ?? "all")
  .split(",")
  .map((year) => year.trim())
  .filter(Boolean);
const importAllYears = selectedYears.includes("all");
const limit = Number(args.get("limit") ?? 0);
const enrichGithub = args.get("enrich-github") === "true";
const maxRepos = Number(args.get("max-repos") ?? 100);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const cleanText = (value?: string) =>
  value
    ?.replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000);

const uniqueStrings = (items: Array<string | undefined>) =>
  Array.from(new Set(items.map((item) => item?.trim()).filter((item): item is string => Boolean(item)))).slice(0, 24);

const githubRepoFromUrl = (value?: string) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname !== "github.com" && url.hostname !== "www.github.com") return null;
    const [owner, repo] = url.pathname.split("/").filter(Boolean);
    if (!owner || !repo) return null;
    const cleanRepo = repo.replace(/\.git$/, "");
    if (["issues", "pulls", "pull", "tree", "blob", "commit", "releases"].includes(cleanRepo)) return null;
    return { owner, repo: cleanRepo };
  } catch {
    return null;
  }
};

async function main() {
  console.log(`Fetching ${apiUrl}`);
  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error(`GSoC API request failed: ${response.status}`);
  const allOrganizations = (await response.json()) as GsocOrganization[];
  const organizations = limit > 0 ? allOrganizations.slice(0, limit) : allOrganizations;

  const catalogUser = await ensureCatalogUser();
  const stats = {
    organizations: 0,
    programParticipations: 0,
    repositories: 0,
    githubReposEnriched: 0,
    skippedGithubRepos: 0
  };
  const seenRepos = new Set<string>();

  for (const item of organizations) {
    if (!item.name?.trim()) continue;
    const years = Object.entries(item.years ?? {}).filter(([year]) => importAllYears || selectedYears.includes(year));
    if (!years.length) continue;

    const projectCount = years.reduce((sum, [, yearData]) => sum + (yearData.num_projects ?? yearData.projects?.length ?? 0), 0);
    const techStack = uniqueStrings([...(item.technologies ?? []), ...(item.topics ?? [])]);
    const slug = `gsoc-${slugify(item.name)}`;
    const externalId = `gsoc:org:${slug}`;
    const beginnerScore = Math.min(5, Number((2.5 + Math.min(projectCount, 25) / 12).toFixed(1)));
    const activityScore = Math.min(100, projectCount * 2 + years.length * 5);
    const programCredibilityScore = Math.min(100, years.length * 15);

    const organization = await prisma.organization.upsert({
      where: {
        userId_source_externalId: {
          userId: catalogUser.id,
          source,
          externalId
        }
      },
      update: {
        name: item.name,
        slug,
        logoUrl: item.image_url ?? null,
        websiteUrl: item.url ?? null,
        website: item.url ?? null,
        description: cleanText(item.description) ?? null,
        category: item.category ?? null,
        techStack,
        beginnerFriendlyScore: beginnerScore,
        activityScore,
        reputationScore: programCredibilityScore,
        syncedAt: new Date()
      },
      create: {
        userId: catalogUser.id,
        name: item.name,
        slug,
        logoUrl: item.image_url ?? null,
        websiteUrl: item.url ?? null,
        website: item.url ?? null,
        description: cleanText(item.description) ?? null,
        category: item.category ?? null,
        techStack,
        beginnerFriendlyScore: beginnerScore,
        activityScore,
        reputationScore: programCredibilityScore,
        source,
        externalId,
        syncedAt: new Date()
      }
    });
    stats.organizations += 1;

    for (const [year, yearData] of years) {
      await prisma.programParticipation.upsert({
        where: {
          organizationId_programName_year: {
            organizationId: organization.id,
            programName: "GSoC",
            year: Number(year)
          }
        },
        update: {
          sourceUrl: yearData.projects_url ?? null
        },
        create: {
          organizationId: organization.id,
          programName: "GSoC",
          year: Number(year),
          sourceUrl: yearData.projects_url ?? null
        }
      });
      stats.programParticipations += 1;

      for (const project of yearData.projects ?? []) {
        const repoRef = githubRepoFromUrl(project.code_url) ?? githubRepoFromUrl(project.project_url);
        if (!repoRef) continue;
        const repoKey = `${repoRef.owner}/${repoRef.repo}`.toLowerCase();
        if (seenRepos.has(repoKey)) continue;
        seenRepos.add(repoKey);
        if (stats.repositories >= maxRepos) continue;

        const githubRepo = enrichGithub ? await fetchGitHubRepo(repoRef.owner, repoRef.repo) : null;
        if (enrichGithub && !githubRepo) {
          stats.skippedGithubRepos += 1;
          continue;
        }

        await upsertRepository(catalogUser.id, organization.id, repoRef.owner, repoRef.repo, project, githubRepo);
        stats.repositories += 1;
        if (githubRepo) stats.githubReposEnriched += 1;
      }
    }
  }

  console.log(JSON.stringify(stats, null, 2));
}

async function ensureCatalogUser() {
  const passwordHash = await bcrypt.hash("not-usable-catalog-user", 12);
  return prisma.user.upsert({
    where: { email: catalogEmail },
    update: {
      name: "Maintainex Catalog",
      username: catalogUsername
    },
    create: {
      name: "Maintainex Catalog",
      username: catalogUsername,
      email: catalogEmail,
      passwordHash,
      passwordSetAt: null,
      role: "VIEWER"
    }
  });
}

async function fetchGitHubRepo(owner: string, repo: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": process.env.GITHUB_API_VERSION ?? "2022-11-28",
    "User-Agent": "Maintainex"
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!response.ok) return null;
  return response.json() as Promise<GitHubRepo>;
}

async function upsertRepository(userId: string, organizationId: string, owner: string, repoName: string, project: GsocProject, githubRepo: GitHubRepo | null) {
  const name = githubRepo?.name ?? repoName;
  const fullName = githubRepo?.full_name ?? `${owner}/${repoName}`;
  const slug = slugify(name);
  const externalId = githubRepo ? `github:repo:${githubRepo.id}` : `gsoc:repo:${fullName.toLowerCase()}`;
  const techStack = uniqueStrings([githubRepo?.language ?? undefined]);
  const data = {
    githubRepoId: githubRepo ? String(githubRepo.id) : undefined,
    slug,
    fullName,
    githubUrl: githubRepo?.html_url ?? `https://github.com/${owner}/${repoName}`,
    description: cleanText(githubRepo?.description ?? project.short_description ?? project.title) ?? null,
    primaryLanguage: githubRepo?.language ?? null,
    primaryTechStack: githubRepo?.language ?? null,
    license: githubRepo?.license?.spdx_id ?? githubRepo?.license?.name ?? null,
    stars: githubRepo?.stargazers_count ?? 0,
    forks: githubRepo?.forks_count ?? 0,
    watchers: githubRepo?.watchers_count ?? 0,
    openIssues: githubRepo?.open_issues_count ?? 0,
    techStack,
    source,
    externalId,
    githubNodeId: githubRepo?.node_id,
    syncedAt: new Date()
  } satisfies Partial<Prisma.RepositoryUncheckedCreateInput>;

  await prisma.repository.upsert({
    where: {
      userId_organizationId_name: {
        userId,
        organizationId,
        name
      }
    },
    update: data,
    create: {
      userId,
      organizationId,
      name,
      ...data
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
