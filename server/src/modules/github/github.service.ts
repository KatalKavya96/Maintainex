import crypto from "crypto";
import jwt from "jsonwebtoken";
import type {
  ActivityStatus,
  ActivityType,
  ClosingReason,
  GitHubIntegration,
  Prisma,
  ReviewType,
  ScheduledWorkStatus
} from "@prisma/client";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { emitDashboardUpdate, emitToUser } from "../../realtime/socket";
import { ApiError } from "../../utils/ApiError";

type GitHubUser = {
  id: number;
  login: string;
  name?: string | null;
  html_url?: string;
};

type GitHubRepo = {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  html_url: string;
  description?: string | null;
  language?: string | null;
  owner: GitHubUser & { node_id?: string };
  updated_at?: string;
};

type GitHubSearchItem = {
  id: number;
  node_id: string;
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  merged_at?: string | null;
  body?: string | null;
  user?: GitHubUser | null;
  assignee?: GitHubUser | null;
  assignees?: GitHubUser[];
  labels?: { name: string }[];
  repository_url: string;
  pull_request?: { html_url: string; merged_at?: string | null };
  draft?: boolean;
};

type GitHubWebhookPayload = Record<string, unknown> & {
  action?: string;
  sender?: GitHubUser;
  repository?: GitHubRepo;
  pull_request?: GitHubSearchItem & { merged?: boolean; draft?: boolean; user?: GitHubUser | null };
  review?: { id: number; node_id?: string; user?: GitHubUser | null; state?: string; submitted_at?: string; body?: string | null; html_url?: string };
  issue?: GitHubSearchItem;
  comment?: { id: number; node_id?: string; user?: GitHubUser | null; body?: string | null; html_url?: string; created_at?: string };
  assignee?: GitHubUser;
};

const source = "GITHUB_SYNC" as const;
const staleDays = 14;

const githubApiBase = "https://api.github.com";

const toDate = (value?: string | null) => (value ? new Date(value) : new Date());

const labelsFrom = (item: Pick<GitHubSearchItem, "labels">) => (item.labels ?? []).map((label) => label.name).filter(Boolean).slice(0, 12);

const repositoryNameFromUrl = (repositoryUrl: string) => {
  const id = repositoryUrl.split("/").pop();
  return id ? Number(id) : null;
};

const splitFullName = (fullName: string) => {
  const [organizationName, repositoryName] = fullName.split("/");
  return { organizationName, repositoryName };
};

const statusForIssue = (item: Pick<GitHubSearchItem, "state">): ActivityStatus => (item.state === "closed" ? "CLOSED" : "OPEN");

const statusForPull = (item: Pick<GitHubSearchItem, "state" | "draft" | "pull_request" | "merged_at">): ActivityStatus => {
  if (item.draft) return "DRAFT";
  if (item.merged_at || item.pull_request?.merged_at) return "MERGED";
  return item.state === "closed" ? "CLOSED" : "OPEN";
};

const reviewTypeFromState = (state?: string): ReviewType => {
  if (state === "approved") return "APPROVED";
  if (state === "changes_requested") return "CHANGES_REQUESTED";
  if (state === "commented") return "COMMENTED";
  return "COMMENTED";
};

const activityStatusFromReview = (state?: string): ActivityStatus => {
  if (state === "approved") return "APPROVED";
  if (state === "changes_requested") return "CHANGES_REQUESTED";
  return "REVIEWED";
};

const closingReasonFor = (item: Pick<GitHubSearchItem, "state" | "pull_request" | "merged_at">): ClosingReason => {
  if (item.merged_at || item.pull_request?.merged_at) return "COMPLETED";
  return item.state === "closed" ? "AUTHOR_CLOSED" : "NOT_APPLICABLE";
};

export class GitHubService {
  async status(userId: string) {
    const integration = await prisma.gitHubIntegration.findUnique({ where: { userId } });
    return {
      connected: Boolean(integration),
      configAvailable: this.isOAuthConfigured(),
      webhookConfigured: Boolean(env.githubWebhookSecret),
      login: integration?.login ?? null,
      scope: integration?.scope ?? null,
      lastSyncedAt: integration?.lastSyncedAt ?? null,
      syncCursor: integration?.syncCursor ?? null
    };
  }

  async oauthUrl(userId: string) {
    if (!env.githubClientId) throw new ApiError(503, "GitHub OAuth is not configured");
    const redirectUri = this.redirectUri();
    const state = jwt.sign({ userId, purpose: "github-oauth" }, env.jwtSecret, { expiresIn: "10m" });
    const params = new URLSearchParams({
      client_id: env.githubClientId,
      redirect_uri: redirectUri,
      scope: env.githubOAuthScopes,
      state,
      allow_signup: "true"
    });
    return { url: `https://github.com/login/oauth/authorize?${params.toString()}` };
  }

  async oauthCallback(code: string, state: string) {
    if (!this.isOAuthConfigured()) throw new ApiError(503, "GitHub OAuth is not configured");
    const decoded = jwt.verify(state, env.jwtSecret) as { userId?: string; purpose?: string };
    if (!decoded.userId || decoded.purpose !== "github-oauth") throw new ApiError(400, "Invalid OAuth state");

    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: env.githubClientId,
        client_secret: env.githubClientSecret,
        code,
        redirect_uri: this.redirectUri()
      })
    });
    const tokenJson = (await tokenResponse.json()) as { access_token?: string; token_type?: string; scope?: string; error_description?: string };
    if (!tokenResponse.ok || !tokenJson.access_token) {
      throw new ApiError(400, tokenJson.error_description ?? "GitHub OAuth failed");
    }

    const profile = await this.githubRequest<GitHubUser>("/user", tokenJson.access_token);
    const integration = await prisma.gitHubIntegration.upsert({
      where: { userId: decoded.userId },
      update: {
        githubUserId: String(profile.id),
        login: profile.login,
        accessTokenEncrypted: this.encryptToken(tokenJson.access_token),
        tokenType: tokenJson.token_type,
        scope: tokenJson.scope
      },
      create: {
        userId: decoded.userId,
        githubUserId: String(profile.id),
        login: profile.login,
        accessTokenEncrypted: this.encryptToken(tokenJson.access_token),
        tokenType: tokenJson.token_type,
        scope: tokenJson.scope
      }
    });

    return { connected: true, login: integration.login };
  }

  async disconnect(userId: string) {
    await prisma.gitHubIntegration.deleteMany({ where: { userId } });
    return { connected: false };
  }

  async sync(userId: string, options?: { since?: string; maxPages?: number }) {
    const integration = await prisma.gitHubIntegration.findUnique({ where: { userId } });
    if (!integration) throw new ApiError(400, "Connect GitHub before syncing");
    const token = this.decryptToken(integration.accessTokenEncrypted);
    const since = options?.since ? new Date(options.since) : integration.syncCursor ?? new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
    const sinceDate = since.toISOString().slice(0, 10);
    const maxPages = Math.min(Math.max(options?.maxPages ?? 2, 1), 5);
    const result = {
      repositories: 0,
      prRaised: 0,
      prReviewed: 0,
      issuesRaised: 0,
      mergedPrs: 0,
      comments: 0,
      assignedIssues: 0,
      staleScheduledTasks: 0
    };

    const repos = await this.paginated<GitHubRepo>("/user/repos?affiliation=owner,collaborator,organization_member&sort=updated&per_page=100", token, maxPages);
    for (const repo of repos) {
      await this.ensureRepository(userId, repo);
      result.repositories += 1;
    }

    const searchGroups = [
      { key: "prRaised" as const, query: `author:${integration.login} type:pr updated:>=${sinceDate}`, activityType: "PR_RAISED" as ActivityType },
      { key: "prReviewed" as const, query: `reviewed-by:${integration.login} type:pr updated:>=${sinceDate}`, activityType: "PR_REVIEWED" as ActivityType },
      { key: "issuesRaised" as const, query: `author:${integration.login} type:issue updated:>=${sinceDate}`, activityType: "ISSUE_RAISED" as ActivityType },
      { key: "mergedPrs" as const, query: `author:${integration.login} type:pr is:merged merged:>=${sinceDate}`, activityType: "MERGED" as ActivityType },
      { key: "comments" as const, query: `commenter:${integration.login} updated:>=${sinceDate}`, activityType: "COMMENTED" as ActivityType }
    ];

    for (const group of searchGroups) {
      const items = await this.searchIssues(token, group.query, maxPages);
      for (const item of items) {
        const repo = await this.repoForSearchItem(token, item);
        if (!repo) continue;
        await this.upsertActivityFromItem(userId, repo, item, group.activityType, `github:${group.key}:${item.node_id}`);
        result[group.key] += 1;
      }
    }

    const assigned = await this.searchIssues(token, `assignee:${integration.login} type:issue state:open updated:>=${sinceDate}`, maxPages);
    for (const item of assigned) {
      const repo = await this.repoForSearchItem(token, item);
      if (!repo) continue;
      await this.upsertScheduledIssue(userId, repo, item);
      result.assignedIssues += 1;
    }

    result.staleScheduledTasks = await prisma.scheduledWork.count({
      where: {
        userId,
        source,
        status: { in: ["PLANNED", "IN_PROGRESS", "POSTPONED", "BLOCKED"] },
        updatedAt: { lt: new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000) }
      }
    });

    await prisma.gitHubIntegration.update({
      where: { userId },
      data: { lastSyncedAt: new Date(), syncCursor: new Date() }
    });
    emitDashboardUpdate(userId);
    return result;
  }

  async handleWebhook(headers: Record<string, string | string[] | undefined>, rawBody: Buffer | undefined, payload: GitHubWebhookPayload) {
    if (!env.githubWebhookSecret) throw new ApiError(503, "GitHub webhook secret is not configured");
    if (!rawBody) throw new ApiError(400, "Missing raw webhook body");
    this.verifySignature(headers["x-hub-signature-256"], rawBody);

    const deliveryId = this.headerValue(headers["x-github-delivery"]);
    const event = this.headerValue(headers["x-github-event"]) ?? "unknown";
    if (!deliveryId) throw new ApiError(400, "Missing GitHub delivery id");

    const existing = await prisma.gitHubWebhookDelivery.findUnique({ where: { deliveryId } });
    if (existing?.status === "PROCESSED" || existing?.status === "SKIPPED") {
      return { status: "duplicate", deliveryId };
    }

    const delivery = await prisma.gitHubWebhookDelivery.upsert({
      where: { deliveryId },
      update: { event, action: payload.action, status: "RECEIVED", payload: payload as Prisma.InputJsonObject },
      create: { deliveryId, event, action: payload.action, payload: payload as Prisma.InputJsonObject }
    });

    try {
      const result = await this.processWebhook(event, payload);
      await prisma.gitHubWebhookDelivery.update({
        where: { id: delivery.id },
        data: { status: result.processed ? "PROCESSED" : "SKIPPED", processedAt: new Date(), error: result.reason ?? null }
      });
      return { deliveryId, ...result };
    } catch (error) {
      await prisma.gitHubWebhookDelivery.update({
        where: { id: delivery.id },
        data: { status: "FAILED", processedAt: new Date(), error: error instanceof Error ? error.message : "Webhook processing failed" }
      });
      throw error;
    }
  }

  private async processWebhook(event: string, payload: GitHubWebhookPayload) {
    const action = payload.action;
    if (!payload.repository) return { processed: false, reason: "Missing repository payload" };

    if (event === "pull_request" && payload.pull_request) {
      if (action === "opened" || action === "reopened" || action === "synchronize") {
        return this.webhookActivity(payload.pull_request.user?.id, payload.repository, payload.pull_request, "PR_RAISED", `github:webhook:pr:${payload.pull_request.node_id}`);
      }
      if (action === "closed" && payload.pull_request.merged) {
        const result = await this.webhookActivity(payload.pull_request.user?.id, payload.repository, payload.pull_request, "MERGED", `github:webhook:merged:${payload.pull_request.node_id}`);
        await this.updateExistingActivityStatus(payload.pull_request.user?.id, `github:prRaised:${payload.pull_request.node_id}`, "MERGED");
        return result;
      }
    }

    if (event === "pull_request_review" && payload.pull_request && payload.review) {
      const externalId = `github:webhook:review:${payload.review.node_id ?? payload.review.id}`;
      return this.webhookActivity(payload.review.user?.id, payload.repository, payload.pull_request, "PR_REVIEWED", externalId, {
        reviewType: reviewTypeFromState(payload.review.state),
        status: activityStatusFromReview(payload.review.state),
        notes: payload.review.body ?? undefined,
        date: toDate(payload.review.submitted_at),
        link: payload.review.html_url
      });
    }

    if (event === "issues" && payload.issue) {
      if (action === "opened") {
        return this.webhookActivity(payload.issue.user?.id, payload.repository, payload.issue, "ISSUE_RAISED", `github:webhook:issue:${payload.issue.node_id}`);
      }
      if (action === "closed") {
        return this.webhookActivity(payload.sender?.id, payload.repository, payload.issue, "ISSUE_CLOSED", `github:webhook:issue-closed:${payload.issue.node_id}`);
      }
      if (action === "assigned" && payload.assignee) {
        const integration = await this.integrationByGithubUserId(payload.assignee.id);
        if (!integration) return { processed: false, reason: "Assignee is not connected to Maintainex" };
        await this.upsertScheduledIssue(integration.userId, payload.repository, payload.issue);
        emitDashboardUpdate(integration.userId);
        return { processed: true, affectedUserId: integration.userId };
      }
    }

    if (event === "issue_comment" && action === "created" && payload.issue && payload.comment) {
      return this.webhookActivity(payload.comment.user?.id, payload.repository, payload.issue, "COMMENTED", `github:webhook:comment:${payload.comment.node_id ?? payload.comment.id}`, {
        notes: payload.comment.body ?? undefined,
        date: toDate(payload.comment.created_at),
        link: payload.comment.html_url
      });
    }

    return { processed: false, reason: `Ignored event ${event}:${action ?? "unknown"}` };
  }

  private async webhookActivity(
    githubUserId: number | undefined,
    repo: GitHubRepo,
    item: GitHubSearchItem,
    activityType: ActivityType,
    externalId: string,
    overrides: Partial<Prisma.ActivityUncheckedCreateInput & { date: Date }> = {}
  ) {
    if (!githubUserId) return { processed: false, reason: "Missing GitHub user id" };
    const integration = await this.integrationByGithubUserId(githubUserId);
    if (!integration) return { processed: false, reason: "Actor is not connected to Maintainex" };
    await this.upsertActivityFromItem(integration.userId, repo, item, activityType, externalId, overrides);
    emitDashboardUpdate(integration.userId);
    return { processed: true, affectedUserId: integration.userId };
  }

  private async integrationByGithubUserId(githubUserId: number) {
    return prisma.gitHubIntegration.findUnique({ where: { githubUserId: String(githubUserId) } });
  }

  private async updateExistingActivityStatus(githubUserId: number | undefined, externalId: string, status: ActivityStatus) {
    if (!githubUserId) return;
    const integration = await this.integrationByGithubUserId(githubUserId);
    if (!integration) return;
    await prisma.activity.updateMany({ where: { userId: integration.userId, source, externalId }, data: { status, syncedAt: new Date() } });
  }

  private async upsertActivityFromItem(
    userId: string,
    repo: GitHubRepo,
    item: GitHubSearchItem,
    activityType: ActivityType,
    externalId: string,
    overrides: Partial<Prisma.ActivityUncheckedCreateInput & { date: Date }> = {}
  ) {
    const { organization, repository } = await this.ensureRepository(userId, repo);
    const isPullRequest = Boolean(item.pull_request || activityType === "PR_RAISED" || activityType === "PR_REVIEWED" || activityType === "MERGED");
    const data = {
      userId,
      date: overrides.date ?? toDate(item.created_at),
      activityType,
      title: item.title,
      number: String(item.number),
      link: overrides.link ?? item.html_url,
      status: overrides.status ?? (isPullRequest ? statusForPull(item) : statusForIssue(item)),
      reviewType: overrides.reviewType ?? (activityType === "PR_REVIEWED" ? "COMMENTED" : "NOT_APPLICABLE"),
      closingReason: overrides.closingReason ?? closingReasonFor(item),
      description: item.body?.slice(0, 2000) ?? null,
      notes: overrides.notes ?? null,
      tags: labelsFrom(item),
      organizationId: organization.id,
      repositoryId: repository.id,
      organizationNameSnapshot: organization.name,
      repositoryNameSnapshot: repository.name,
      source,
      externalId,
      githubNodeId: item.node_id,
      syncedAt: new Date()
    } satisfies Prisma.ActivityUncheckedCreateInput;

    return prisma.activity.upsert({
      where: { userId_source_externalId: { userId, source, externalId } },
      update: {
        date: data.date,
        title: data.title,
        number: data.number,
        link: data.link,
        status: data.status,
        reviewType: data.reviewType,
        closingReason: data.closingReason,
        description: data.description,
        notes: data.notes,
        tags: data.tags,
        organizationId: data.organizationId,
        repositoryId: data.repositoryId,
        organizationNameSnapshot: data.organizationNameSnapshot,
        repositoryNameSnapshot: data.repositoryNameSnapshot,
        githubNodeId: data.githubNodeId,
        syncedAt: data.syncedAt
      },
      create: data
    });
  }

  private async upsertScheduledIssue(userId: string, repo: GitHubRepo, item: GitHubSearchItem) {
    const { organization, repository } = await this.ensureRepository(userId, repo);
    const externalId = `github:assigned-issue:${item.node_id}`;
    const status: ScheduledWorkStatus = item.state === "closed" ? "DONE" : "PLANNED";
    return prisma.scheduledWork.upsert({
      where: { userId_source_externalId: { userId, source, externalId } },
      update: {
        title: item.title,
        status,
        organizationName: organization.name,
        repositoryName: repository.name,
        itemNumber: item.number,
        itemUrl: item.html_url,
        labels: labelsFrom(item),
        tags: labelsFrom(item),
        githubNodeId: item.node_id,
        syncedAt: new Date(),
        completedAt: status === "DONE" ? new Date() : undefined
      },
      create: {
        userId,
        title: item.title,
        type: "ISSUE_WORK",
        status,
        priority: "MEDIUM",
        organizationName: organization.name,
        repositoryName: repository.name,
        itemNumber: item.number,
        itemUrl: item.html_url,
        assignedToMe: true,
        assignedSince: toDate(item.created_at),
        labels: labelsFrom(item),
        tags: labelsFrom(item),
        context: item.body?.slice(0, 2000) ?? null,
        source,
        externalId,
        githubNodeId: item.node_id,
        syncedAt: new Date(),
        completedAt: status === "DONE" ? new Date() : undefined
      }
    });
  }

  private async ensureRepository(userId: string, repo: GitHubRepo) {
    const { organizationName, repositoryName } = splitFullName(repo.full_name);
    const orgExternalId = `github:org:${repo.owner.id}`;
    const repositoryExternalId = `github:repo:${repo.id}`;

    const existingOrganization = await prisma.organization.findUnique({ where: { userId_name: { userId, name: organizationName } } });
    const organization = existingOrganization
      ? await prisma.organization.update({
          where: { id: existingOrganization.id },
          data: {
            githubUrl: existingOrganization.githubUrl ?? repo.owner.html_url,
            externalId: existingOrganization.externalId ?? orgExternalId,
            githubNodeId: existingOrganization.githubNodeId ?? repo.owner.node_id,
            syncedAt: new Date()
          }
        })
      : await prisma.organization.create({
          data: {
            userId,
            name: organizationName,
            githubUrl: repo.owner.html_url,
            source,
            externalId: orgExternalId,
            githubNodeId: repo.owner.node_id,
            syncedAt: new Date()
          }
        });

    const existingRepository = await prisma.repository.findUnique({
      where: { userId_organizationId_name: { userId, organizationId: organization.id, name: repositoryName } }
    });
    const repository = existingRepository
      ? await prisma.repository.update({
          where: { id: existingRepository.id },
          data: {
            githubUrl: existingRepository.githubUrl ?? repo.html_url,
            description: existingRepository.description ?? repo.description,
            primaryTechStack: existingRepository.primaryTechStack ?? repo.language,
            externalId: existingRepository.externalId ?? repositoryExternalId,
            githubNodeId: existingRepository.githubNodeId ?? repo.node_id,
            syncedAt: new Date()
          }
        })
      : await prisma.repository.create({
          data: {
            userId,
            organizationId: organization.id,
            name: repositoryName,
            githubUrl: repo.html_url,
            description: repo.description ?? null,
            primaryTechStack: repo.language ?? null,
            source,
            externalId: repositoryExternalId,
            githubNodeId: repo.node_id,
            syncedAt: new Date()
          }
        });

    return { organization, repository };
  }

  private async repoForSearchItem(token: string, item: GitHubSearchItem) {
    const id = repositoryNameFromUrl(item.repository_url);
    if (!id) return null;
    return this.githubRequest<GitHubRepo>(`/repositories/${id}`, token).catch(() => null);
  }

  private async searchIssues(token: string, query: string, maxPages: number) {
    const items: GitHubSearchItem[] = [];
    for (let page = 1; page <= maxPages; page += 1) {
      const response = await this.githubRequest<{ items: GitHubSearchItem[] }>(
        `/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=50&page=${page}`,
        token
      );
      items.push(...response.items);
      if (response.items.length < 50) break;
    }
    return items;
  }

  private async paginated<T>(path: string, token: string, maxPages: number) {
    const items: T[] = [];
    for (let page = 1; page <= maxPages; page += 1) {
      const separator = path.includes("?") ? "&" : "?";
      const response = await this.githubRequest<T[]>(`${path}${separator}page=${page}`, token);
      items.push(...response);
      if (response.length < 100) break;
    }
    return items;
  }

  private async githubRequest<T>(path: string, token: string): Promise<T> {
    const response = await fetch(`${githubApiBase}${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": env.githubApiVersion,
        "User-Agent": "Maintainex"
      }
    });
    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as { message?: string };
      throw new ApiError(response.status, error.message ?? `GitHub request failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  private verifySignature(signature: string | string[] | undefined, rawBody: Buffer) {
    const expected = `sha256=${crypto.createHmac("sha256", env.githubWebhookSecret!).update(rawBody).digest("hex")}`;
    const actual = this.headerValue(signature);
    if (!actual) throw new ApiError(401, "Missing GitHub signature");
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(actual);
    if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
      throw new ApiError(401, "Invalid GitHub signature");
    }
  }

  private headerValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
  }

  private isOAuthConfigured() {
    return Boolean(env.githubClientId && env.githubClientSecret);
  }

  private redirectUri() {
    if (env.githubRedirectUri) return env.githubRedirectUri;
    return `http://localhost:${env.port}/api/github/callback`;
  }

  private encryptToken(token: string) {
    const key = this.encryptionKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
  }

  private decryptToken(value: string) {
    if (!value.startsWith("v1:")) return value;
    const [, ivValue, tagValue, encryptedValue] = value.split(":");
    const decipher = crypto.createDecipheriv("aes-256-gcm", this.encryptionKey(), Buffer.from(ivValue, "base64url"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8");
  }

  private encryptionKey() {
    return crypto.createHash("sha256").update(env.githubTokenEncryptionKey ?? env.jwtSecret).digest();
  }
}
