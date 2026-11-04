import type { ActivityType, GitHubIntegration, PrismaClient } from "@prisma/client";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { clientOriginFor } from "../../config/origins";
import { emitDashboardUpdate } from "../../realtime/socket";
import { ApiError, signInRequired } from "../../utils/ApiError";
import { decryptToken, encryptToken } from "../../utils/tokenCrypto";
import type { AuthUser } from "../auth/auth.types";
import { OAuthAccounts } from "../auth/oauth-accounts";
import { nonceHashFor, readHandoff, signHandoff, signState, type OAuthState } from "../auth/oauth-handoff";
import { exchangeGithubCode, githubApi, providerConfigured, redirectUriFor } from "../auth/oauth-providers";
import { GitHubAuthError, GitHubClient, GitHubRateLimitError } from "./github.api";
import { GitHubRecords, type Outcome } from "./github.records";
import { preferenceKeys, type GitHubUser, type SyncPreferences } from "./github.types";
import { GitHubWebhooks } from "./github.webhook";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const AUTO_SYNC_EVERY = 60 * MINUTE;
const LOCK_EXPIRES = 10 * MINUTE;

type GroupKey = "prRaised" | "prReviewed" | "issuesRaised" | "mergedPrs" | "comments";
type SyncOptions = { since?: string; maxPages?: number; auto?: boolean };

const emptyResult = () => ({
  status: "completed" as "completed" | "skipped",
  reason: undefined as string | undefined,
  repositories: 0, prRaised: 0, prReviewed: 0, issuesRaised: 0, mergedPrs: 0, comments: 0, assignedIssues: 0,
  created: 0, updated: 0, keptDeleted: 0, failed: 0, truncated: false
});
export type SyncResult = ReturnType<typeof emptyResult>;

const preferencesOf = (integration: GitHubIntegration): SyncPreferences =>
  Object.fromEntries(preferenceKeys.map((key) => [key, integration[key]])) as SyncPreferences;

export class GitHubService {
  constructor(
    private db: PrismaClient = prisma,
    private records = new GitHubRecords(db),
    private accounts = new OAuthAccounts(),
    private clientFor = (token: string) => new GitHubClient(token),
    private webhooks = new GitHubWebhooks(db, records)
  ) {}

  async status(user: AuthUser) {
    const integration = user.id === "viewer" ? null : await this.db.gitHubIntegration.findUnique({ where: { userId: user.id } });
    return {
      connected: Boolean(integration),
      configAvailable: providerConfigured("github"),
      login: integration?.login ?? null,
      scopes: env.githubOAuthScopes,
      lastSyncedAt: integration?.lastSyncedAt ?? null,
      syncing: Boolean(integration?.syncStartedAt && Date.now() - integration.syncStartedAt.getTime() < LOCK_EXPIRES),
      lastSyncError: integration?.lastSyncError ?? null,
      needsReconnect: integration?.needsReconnect ?? false,
      preferences: integration ? preferencesOf(integration) : null,
      webhookConfigured: Boolean(env.githubWebhookSecret)
    };
  }

  connectStart(userId: string, input: { nonce: unknown; origin: unknown; apiBase: string }) {
    this.ensurePersistedUser(userId);
    if (!providerConfigured("github")) throw new ApiError(503, "GitHub connections are not configured yet.");
    const state = signState({ purpose: "github-oauth", provider: "github", userId, nonceHash: nonceHashFor(input.nonce), origin: clientOriginFor(input.origin) });
    const params = new URLSearchParams({ client_id: env.githubClientId!, redirect_uri: redirectUriFor("github", input.apiBase), scope: env.githubOAuthScopes, state, allow_signup: "true" });
    return { url: `https://github.com/login/oauth/authorize?${params.toString()}` };
  }

  /** Runs at the OAuth callback: the code must be used immediately, but the account is linked only once the same signed-in browser confirms. */
  async connectComplete(state: OAuthState, code: string, apiBase: string) {
    const token = await exchangeGithubCode(code, redirectUriFor("github", apiBase));
    const profile = await githubApi<GitHubUser>("/user", token.access_token);
    return signHandoff({
      purpose: "github-connect", nonceHash: state.nonceHash, userId: state.userId,
      token: encryptToken(token.access_token), githubUserId: String(profile.id), login: profile.login, scope: token.scope, tokenType: token.token_type
    });
  }

  async connectFinish(userId: string, code: string, nonce: unknown) {
    this.ensurePersistedUser(userId);
    const handoff = readHandoff(code, nonce, "github-connect");
    if (handoff.userId !== userId || !handoff.token || !handoff.githubUserId || !handoff.login) {
      throw new ApiError(403, "This GitHub connection was started by a different account. Start again from Settings.");
    }
    return this.accounts.connectGithub(userId, {
      githubUserId: handoff.githubUserId, login: handoff.login, accessToken: decryptToken(handoff.token), scope: handoff.scope, tokenType: handoff.tokenType
    });
  }

  async updatePreferences(userId: string, preferences: Partial<SyncPreferences>) {
    this.ensurePersistedUser(userId);
    const integration = await this.db.gitHubIntegration.update({ where: { userId }, data: preferences }).catch(() => null);
    if (!integration) throw new ApiError(404, "Connect GitHub before changing sync settings.");
    return preferencesOf(integration);
  }

  async disconnect(userId: string, options: { removeImported?: boolean } = {}) {
    this.ensurePersistedUser(userId);
    const integration = await this.db.gitHubIntegration.findUnique({ where: { userId } });
    if (integration) await this.revokeGrant(decryptToken(integration.accessTokenEncrypted));
    await this.db.gitHubIntegration.deleteMany({ where: { userId } });
    const removed = options.removeImported ? await this.records.removeImported(userId) : { activities: 0, work: 0 };
    emitDashboardUpdate(userId);
    return { connected: false, removed };
  }

  async sync(userId: string, options: SyncOptions = {}): Promise<SyncResult> {
    this.ensurePersistedUser(userId);
    const integration = await this.db.gitHubIntegration.findUnique({ where: { userId } });
    const skipped = (reason: string) => ({ ...emptyResult(), status: "skipped" as const, reason });
    if (!integration) {
      if (options.auto) return skipped("not-connected");
      throw new ApiError(400, "Connect GitHub before syncing.");
    }
    if (integration.needsReconnect) {
      if (options.auto) return skipped("needs-reconnect");
      throw new ApiError(409, "GitHub access was revoked or expired. Reconnect GitHub to resume syncing.");
    }
    if (options.auto && (!integration.autoSync || (integration.lastSyncedAt && Date.now() - integration.lastSyncedAt.getTime() < AUTO_SYNC_EVERY))) {
      return skipped(integration.autoSync ? "up-to-date" : "auto-sync-off");
    }

    const startedAt = new Date();
    const lock = await this.db.gitHubIntegration.updateMany({
      where: { userId, OR: [{ syncStartedAt: null }, { syncStartedAt: { lt: new Date(startedAt.getTime() - LOCK_EXPIRES) } }] },
      data: { syncStartedAt: startedAt }
    });
    if (lock.count === 0) {
      if (options.auto) return skipped("already-running");
      throw new ApiError(409, "A GitHub sync is already running. It will finish in a moment.");
    }

    try {
      const result = await this.run(integration, options);
      await this.db.gitHubIntegration.update({ where: { userId }, data: { lastSyncedAt: startedAt, syncCursor: startedAt, lastSyncError: null, syncStartedAt: null } });
      if (result.created || result.updated) emitDashboardUpdate(userId);
      return result;
    } catch (error) {
      const { message, status, reconnect } = this.describeFailure(error);
      await this.db.gitHubIntegration.update({ where: { userId }, data: { lastSyncError: message, syncStartedAt: null, ...(reconnect ? { needsReconnect: true } : {}) } });
      emitDashboardUpdate(userId);
      throw new ApiError(status, message);
    }
  }

  handleWebhook(...args: Parameters<GitHubWebhooks["handle"]>) {
    return this.webhooks.handle(...args);
  }

  private async run(integration: GitHubIntegration, options: SyncOptions) {
    const { userId, login } = integration;
    const prefs = preferencesOf(integration);
    const client = this.clientFor(decryptToken(integration.accessTokenEncrypted));
    const maxPages = options.auto ? 1 : Math.min(Math.max(options.maxPages ?? 2, 1), 5);
    const since = options.since ? new Date(options.since) : integration.syncCursor ? new Date(integration.syncCursor.getTime() - DAY) : new Date(Date.now() - 30 * DAY);
    const sinceDate = since.toISOString().slice(0, 10);
    const result = emptyResult();
    const tally = (outcome: Outcome) => {
      if (outcome === "created") result.created += 1;
      else if (outcome === "updated") result.updated += 1;
      else result.keptDeleted += 1;
    };

    if (prefs.importRepositories && (!options.auto || !integration.lastSyncedAt)) {
      for (const repo of await client.userRepos(maxPages)) {
        client.remember(repo);
        await this.records.ensureRepository(userId, repo);
        result.repositories += 1;
      }
    }

    const groups: Array<{ key: GroupKey; enabled: boolean; query: string; type: ActivityType }> = [
      { key: "prRaised", enabled: prefs.importPullRequests, query: `author:${login} type:pr updated:>=${sinceDate}`, type: "PR_RAISED" },
      { key: "mergedPrs", enabled: prefs.importPullRequests, query: `author:${login} type:pr is:merged merged:>=${sinceDate}`, type: "MERGED" },
      { key: "prReviewed", enabled: prefs.importReviews, query: `reviewed-by:${login} -author:${login} type:pr updated:>=${sinceDate}`, type: "PR_REVIEWED" },
      { key: "issuesRaised", enabled: prefs.importIssues, query: `author:${login} type:issue updated:>=${sinceDate}`, type: "ISSUE_RAISED" },
      { key: "comments", enabled: prefs.importComments, query: `commenter:${login} -author:${login} updated:>=${sinceDate}`, type: "COMMENTED" }
    ];
    for (const group of groups.filter((item) => item.enabled)) {
      for (const item of await client.searchIssues(group.query, maxPages)) {
        await this.guard(result, async () => {
          const repo = await client.repoFor(item);
          if (!repo) throw new Error("Repository unavailable");
          tally(await this.records.upsertActivity(userId, repo, item, group.type, `github:${group.key}:${item.node_id}`));
          result[group.key] += 1;
        });
      }
    }

    if (prefs.importAssignedIssues) {
      for (const item of await client.searchIssues(`assignee:${login} type:issue updated:>=${sinceDate}`, maxPages)) {
        await this.guard(result, async () => {
          const repo = await client.repoFor(item);
          if (!repo) throw new Error("Repository unavailable");
          tally(await this.records.upsertAssignedIssue(userId, repo, item));
          result.assignedIssues += 1;
        });
      }
    }
    result.truncated = client.truncated;
    return result;
  }

  /** One unreadable item must not abandon the rest; credential and rate-limit failures still stop the run. */
  private async guard(result: SyncResult, work: () => Promise<void>) {
    try {
      await work();
    } catch (error) {
      if (error instanceof GitHubAuthError || error instanceof GitHubRateLimitError) throw error;
      result.failed += 1;
    }
  }

  private describeFailure(error: unknown) {
    if (error instanceof GitHubAuthError) return { status: 409, reconnect: true, message: "GitHub access was revoked or expired. Reconnect GitHub to resume syncing." };
    if (error instanceof GitHubRateLimitError) {
      const when = error.resetAt ? ` after ${error.resetAt.toISOString().slice(11, 16)} UTC` : " in a few minutes";
      return { status: 429, reconnect: false, message: `GitHub's rate limit was reached. Already imported items were kept; sync again${when}.` };
    }
    if (error instanceof ApiError) return { status: error.statusCode, reconnect: false, message: error.message };
    return { status: 502, reconnect: false, message: "GitHub sync failed before finishing. Already imported items were kept; try again shortly." };
  }

  /** Best effort: tells GitHub to forget this authorization so the token stops working everywhere. */
  private async revokeGrant(accessToken: string) {
    if (!env.githubClientId || !env.githubClientSecret) return;
    const basic = Buffer.from(`${env.githubClientId}:${env.githubClientSecret}`).toString("base64");
    await fetch(`https://api.github.com/applications/${env.githubClientId}/grant`, {
      method: "DELETE",
      headers: { Accept: "application/vnd.github+json", Authorization: `Basic ${basic}`, "Content-Type": "application/json", "User-Agent": "Maintainex" },
      body: JSON.stringify({ access_token: accessToken })
    }).catch(() => undefined);
  }

  private ensurePersistedUser(userId: string) {
    if (userId === "viewer") throw signInRequired("Sign in with a real account to use GitHub sync.");
  }
}
