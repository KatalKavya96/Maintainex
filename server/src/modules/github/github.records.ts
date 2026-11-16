import type { ActivityStatus, ActivityType, ClosingReason, Prisma, PrismaClient, ReviewType } from "@prisma/client";
import { prisma } from "../../config/database";
import type { GitHubRepo, GitHubSearchItem } from "./github.types";

export const source = "GITHUB_SYNC" as const;
export type Outcome = "created" | "updated" | "deleted-by-user";
export type ActivityOverrides = Partial<{ date: Date; link: string; status: ActivityStatus; reviewType: ReviewType; closingReason: ClosingReason; notes: string }>;

const toDate = (value?: string | null) => (value ? new Date(value) : new Date());
const labelsFrom = (item: Pick<GitHubSearchItem, "labels">) => (item.labels ?? []).map((label) => label.name).filter(Boolean).slice(0, 12);
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const scopedSlug = (name: string, userId: string) => `${slugify(name)}-${userId.slice(0, 8).toLowerCase()}`;
export const isMerged = (item: Pick<GitHubSearchItem, "merged_at" | "pull_request">) => Boolean(item.merged_at || item.pull_request?.merged_at);

export const reviewTypeFromState = (state?: string): ReviewType =>
  state === "approved" ? "APPROVED" : state === "changes_requested" ? "CHANGES_REQUESTED" : "COMMENTED";
export const activityStatusFromReview = (state?: string): ActivityStatus =>
  state === "approved" ? "APPROVED" : state === "changes_requested" ? "CHANGES_REQUESTED" : "REVIEWED";
export { toDate };

function statusFor(item: GitHubSearchItem, isPullRequest: boolean): ActivityStatus {
  if (isPullRequest && item.draft) return "DRAFT";
  if (isPullRequest && isMerged(item)) return "MERGED";
  return item.state === "closed" ? "CLOSED" : "OPEN";
}

const closingReasonFor = (item: GitHubSearchItem): ClosingReason =>
  isMerged(item) ? "COMPLETED" : item.state === "closed" ? "AUTHOR_CLOSED" : "NOT_APPLICABLE";

/** Writes GitHub data into a user's workspace while leaving their own edits and deletions in charge. */
export class GitHubRecords {
  constructor(private db: PrismaClient = prisma) {}

  private tombstoned(userId: string, externalId: string) {
    return this.db.syncTombstone.findUnique({ where: { userId_source_externalId: { userId, source, externalId } } });
  }

  async upsertActivity(userId: string, repo: GitHubRepo, item: GitHubSearchItem, activityType: ActivityType, externalId: string, overrides: ActivityOverrides = {}): Promise<Outcome> {
    const key = { userId_source_externalId: { userId, source, externalId } };
    const existing = await this.db.activity.findUnique({ where: key, select: { id: true, userEditedAt: true } });
    if (!existing && (await this.tombstoned(userId, externalId))) return "deleted-by-user";

    const isPullRequest = Boolean(item.pull_request) || ["PR_RAISED", "PR_REVIEWED", "MERGED"].includes(activityType);
    const tracked = {
      status: overrides.status ?? statusFor(item, isPullRequest),
      closingReason: overrides.closingReason ?? closingReasonFor(item),
      githubNodeId: item.node_id,
      syncedAt: new Date()
    };
    if (existing) {
      if (existing.userEditedAt) {
        await this.db.activity.update({ where: { id: existing.id }, data: tracked });
        return "updated";
      }
    }
    const { organization, repository } = await this.ensureRepository(userId, repo);
    const content = {
      date: overrides.date ?? toDate(item.created_at),
      title: item.title.slice(0, 500),
      number: String(item.number),
      link: overrides.link ?? item.html_url,
      reviewType: overrides.reviewType ?? (activityType === "PR_REVIEWED" ? "COMMENTED" : "NOT_APPLICABLE"),
      description: item.body?.slice(0, 2000) ?? null,
      tags: labelsFrom(item),
      organizationId: organization.id,
      repositoryId: repository.id,
      organizationNameSnapshot: organization.name,
      repositoryNameSnapshot: repository.name
    } satisfies Prisma.ActivityUncheckedUpdateInput;

    if (existing) {
      await this.db.activity.update({ where: { id: existing.id }, data: { ...content, ...tracked } });
      return "updated";
    }
    await this.db.activity.create({ data: { userId, activityType, source, externalId, notes: overrides.notes?.slice(0, 5000) ?? null, ...content, ...tracked } });
    return "created";
  }

  async upsertAssignedIssue(userId: string, repo: GitHubRepo, item: GitHubSearchItem): Promise<Outcome> {
    const externalId = `github:assigned-issue:${item.node_id}`;
    const key = { userId_source_externalId: { userId, source, externalId } };
    const existing = await this.db.scheduledWork.findUnique({ where: key, select: { id: true, status: true, userEditedAt: true, completedAt: true } });
    if (!existing && (await this.tombstoned(userId, externalId))) return "deleted-by-user";
    const closed = item.state === "closed";

    if (existing) {
      // Upstream can finish work, but never pulls a person's own status back to "planned".
      const finish = closed && !["DONE", "CANCELLED"].includes(existing.status);
      const data: Prisma.ScheduledWorkUncheckedUpdateInput = { syncedAt: new Date(), githubNodeId: item.node_id, ...(finish ? { status: "DONE", completedAt: existing.completedAt ?? new Date() } : {}) };
      if (!existing.userEditedAt) Object.assign(data, { title: item.title.slice(0, 500), itemUrl: item.html_url, itemNumber: item.number, labels: labelsFrom(item), tags: labelsFrom(item) });
      await this.db.scheduledWork.update({ where: { id: existing.id }, data });
      return "updated";
    }
    if (closed) return "updated";
    const { organization, repository } = await this.ensureRepository(userId, repo);
    await this.db.scheduledWork.create({
      data: {
        userId, title: item.title.slice(0, 500), type: "ISSUE_WORK", status: "PLANNED", priority: "MEDIUM",
        organizationName: organization.name, repositoryName: repository.name, itemNumber: item.number, itemUrl: item.html_url,
        assignedToMe: true, assignedSince: toDate(item.created_at), labels: labelsFrom(item), tags: labelsFrom(item),
        context: item.body?.slice(0, 2000) ?? null, source, externalId, githubNodeId: item.node_id, syncedAt: new Date()
      }
    });
    return "created";
  }

  async ensureRepository(userId: string, repo: GitHubRepo) {
    const [organizationName, repositoryName] = repo.full_name.split("/");
    const now = new Date();
    const existingOrganization = await this.db.organization.findUnique({ where: { userId_name: { userId, name: organizationName } } });
    const organization = existingOrganization
      ? await this.db.organization.update({
          where: { id: existingOrganization.id },
          data: {
            githubUrl: existingOrganization.githubUrl ?? repo.owner.html_url,
            logoUrl: existingOrganization.logoUrl ?? repo.owner.avatar_url,
            slug: existingOrganization.slug ?? scopedSlug(organizationName, userId),
            externalId: existingOrganization.externalId ?? `github:org:${repo.owner.id}`,
            githubNodeId: existingOrganization.githubNodeId ?? repo.owner.node_id,
            syncedAt: now
          }
        })
      : await this.db.organization.create({
          data: { userId, name: organizationName, slug: scopedSlug(organizationName, userId), logoUrl: repo.owner.avatar_url, githubUrl: repo.owner.html_url, source, externalId: `github:org:${repo.owner.id}`, githubNodeId: repo.owner.node_id, syncedAt: now }
        });

    const stats = {
      githubRepoId: String(repo.id), fullName: repo.full_name, githubUrl: repo.html_url, primaryLanguage: repo.language ?? null,
      stars: repo.stargazers_count ?? 0, forks: repo.forks_count ?? 0, watchers: repo.watchers_count ?? 0, openIssues: repo.open_issues_count ?? 0, syncedAt: now
    };
    const existingRepository = await this.db.repository.findUnique({ where: { userId_organizationId_name: { userId, organizationId: organization.id, name: repositoryName } } });
    const repository = existingRepository
      ? await this.db.repository.update({
          where: { id: existingRepository.id },
          data: {
            ...stats,
            slug: existingRepository.slug ?? slugify(repositoryName),
            description: existingRepository.description ?? repo.description ?? null,
            license: existingRepository.license ?? repo.license?.spdx_id ?? repo.license?.name ?? null,
            primaryTechStack: existingRepository.primaryTechStack ?? repo.language ?? null,
            externalId: existingRepository.externalId ?? `github:repo:${repo.id}`,
            githubNodeId: existingRepository.githubNodeId ?? repo.node_id
          }
        })
      : await this.db.repository.create({
          data: {
            ...stats, userId, organizationId: organization.id, name: repositoryName, slug: slugify(repositoryName),
            description: repo.description ?? null, license: repo.license?.spdx_id ?? repo.license?.name ?? null,
            techStack: repo.language ? [repo.language] : [], primaryTechStack: repo.language ?? null,
            source, externalId: `github:repo:${repo.id}`, githubNodeId: repo.node_id
          }
        });
    return { organization, repository };
  }

  /** Removes everything a sync created as activity/work; organizations and repositories stay as references. */
  async removeImported(userId: string) {
    const [activities, work] = await this.db.$transaction([
      this.db.activity.deleteMany({ where: { userId, source } }),
      this.db.scheduledWork.deleteMany({ where: { userId, source } }),
      this.db.syncTombstone.deleteMany({ where: { userId, source } })
    ]);
    return { activities: activities.count, work: work.count };
  }
}
