import assert from "node:assert/strict";
import { test } from "node:test";
import { env } from "../src/config/env";
import { requireCronSecret } from "../src/middlewares/cron.middleware";
import { GitHubClient } from "../src/modules/github/github.api";
import { reviewOverrides, standingReview } from "../src/modules/github/github.maintainer";
import { GitHubService } from "../src/modules/github/github.service";
import { encryptToken } from "../src/utils/tokenCrypto";

const repo = { id: 7, node_id: "R_7", name: "widgets", full_name: "acme/widgets", html_url: "https://github.com/acme/widgets", owner: { id: 1, login: "acme", node_id: "O_1" } };
const item = (overrides: any = {}) => ({
  id: 1, node_id: "PR_1", number: 12, title: "Fix the docs", html_url: "https://github.com/acme/widgets/pull/12", state: "open",
  created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-02T00:00:00Z", repository_url: "https://api.github.com/repos/acme/widgets", pull_request: { html_url: "x" }, ...overrides
});
const review = (login: string, state: string, at: string) => ({ id: at.length, user: { id: 2, login }, state, submitted_at: at, body: `${state} body`, html_url: `https://github.com/acme/widgets/pull/12#r-${at}` });

test("a reviewer's standing verdict survives later comments, ignores others and dismissed or pending reviews", () => {
  const approvedThenCommented = [review("Maint", "APPROVED", "2026-11-01T00:00:00Z"), review("maint", "COMMENTED", "2026-11-02T00:00:00Z"), review("someone", "CHANGES_REQUESTED", "2026-11-03T00:00:00Z")];
  assert.equal(standingReview(approvedThenCommented, "maint")?.state, "APPROVED");
  assert.equal(standingReview([review("maint", "CHANGES_REQUESTED", "a"), review("maint", "APPROVED", "b")], "maint")?.state, "APPROVED");
  assert.equal(standingReview([review("maint", "DISMISSED", "a"), review("maint", "PENDING", "b")], "maint")?.state, "DISMISSED");
  assert.equal(standingReview([review("other", "APPROVED", "a")], "maint"), null);

  const commented = reviewOverrides(standingReview([review("maint", "COMMENTED", "2026-11-16T09:00:00Z")], "maint"));
  assert.equal(commented.reviewType, "COMMENTED");
  assert.equal(commented.status, "REVIEWED");
  assert.equal(commented.date?.toISOString(), "2026-11-16T09:00:00.000Z");
  assert.equal(reviewOverrides(standingReview([review("maint", "DISMISSED", "x")], "maint")).reviewType, "COMMENTED");
  const approved = reviewOverrides(standingReview(approvedThenCommented, "maint"));
  assert.deepEqual([approved.reviewType, approved.status], ["APPROVED", "APPROVED"]);
  assert.deepEqual(reviewOverrides(null), {});
});

test("review and pull request lookups use the item's repository path", async () => {
  const calls: string[] = [];
  const client = new GitHubClient("token", async (url) => { calls.push(url); return new Response("[]", { status: 200 }); });
  await client.pullReviews(item());
  await client.pullRequest(item());
  assert.deepEqual(calls, ["https://api.github.com/repos/acme/widgets/pulls/12/reviews?per_page=100", "https://api.github.com/repos/acme/widgets/pulls/12"]);
  assert.deepEqual(await client.pullReviews({ repository_url: "nope", number: 1 }), []);
});

function fixture(integrationOverrides: any, client: any) {
  const upserts: any[] = [];
  const integration = {
    userId: "u", login: "maint", accessTokenEncrypted: encryptToken("gho_fixture"), lastSyncedAt: null, syncCursor: null, needsReconnect: false,
    autoSync: true, importPullRequests: true, importReviews: true, importIssues: false, importComments: false, importAssignedIssues: false, importRepositories: false, ...integrationOverrides
  };
  const db: any = { gitHubIntegration: { findUnique: async () => integration, updateMany: async () => ({ count: 1 }), update: async ({ data }: any) => Object.assign(integration, data) } };
  const records: any = { upsertActivity: async (...args: any[]) => { upserts.push(args); return "created"; } };
  return { service: new GitHubService(db, records, {} as any, () => client, {} as any), upserts };
}

const reviewClient = (mergedBy: string | null, extra: any = {}) => ({
  truncated: false, repoFor: async () => repo, userRepos: async () => [],
  searchIssues: async (q: string) => (q.startsWith("reviewed-by:") ? [item({ state: "closed", pull_request: { html_url: "x", merged_at: "2026-11-10T00:00:00Z" } })] : []),
  pullReviews: async () => [review("maint", "APPROVED", "2026-11-09T00:00:00Z")],
  pullRequest: async () => ({ number: 12, merged_at: "2026-11-10T00:00:00Z", merged_by: mergedBy ? { id: 3, login: mergedBy } : null }),
  ...extra
});

test("reviewed PRs import the real verdict, and merges the user pressed become their own activity", async () => {
  const { service, upserts } = fixture({}, reviewClient("Maint"));
  const result = await service.sync("u");
  const reviewed = upserts.find((call) => call[3] === "PR_REVIEWED");
  assert.equal(reviewed[4], "github:prReviewed:PR_1");
  assert.deepEqual([reviewed[5].reviewType, reviewed[5].status], ["APPROVED", "APPROVED"]);
  const merged = upserts.find((call) => call[4] === "github:mergedByMe:PR_1");
  assert.equal(merged[3], "MERGED");
  assert.equal(merged[5].date.toISOString(), "2026-11-10T00:00:00.000Z");
  assert.deepEqual([result.prReviewed, result.mergedByMe, result.created], [1, 1, 2]);
});

test("someone else's merge, or PR import switched off, records no maintainer merge", async () => {
  const other = fixture({}, reviewClient("someone-else"));
  assert.equal((await other.service.sync("u")).mergedByMe, 0);
  let asked = false;
  const off = fixture({ importPullRequests: false }, reviewClient("maint", { pullRequest: async () => { asked = true; return null; } }));
  assert.equal((await off.service.sync("u")).mergedByMe, 0);
  assert.equal(asked, false);
});

test("scheduled sync runs each due account, counts skips and keeps going after a failure", async () => {
  const seen: any[] = [];
  const db: any = { gitHubIntegration: { findMany: async (args: any) => { seen.push(args); return [{ userId: "a" }, { userId: "b" }, { userId: "c" }]; } } };
  const service = new GitHubService(db, {} as any, {} as any, () => ({}) as any, {} as any);
  const intervals: number[] = [];
  service.sync = (async (userId: string, options: any, every: number) => {
    intervals.push(every);
    assert.equal(options.auto, true);
    if (userId === "b") throw new Error("rate limited");
    return { status: userId === "a" ? "completed" : "skipped" };
  }) as any;
  assert.deepEqual(await service.syncScheduled(), { checked: 3, synced: 1, skipped: 1, failed: 1 });
  assert.deepEqual(seen[0].where, { autoSync: true, needsReconnect: false });
  assert.ok(intervals.every((every) => every < 60 * 60_000));
});

test("the scheduler route needs a configured, long-enough secret and the matching bearer token", () => {
  const original = env.cronSecret;
  const run = (authorization?: string) => {
    let outcome: any = "not-called";
    requireCronSecret({ header: () => authorization } as any, {} as any, (error?: any) => { outcome = error ? error.statusCode : "next"; });
    return outcome;
  };
  try {
    env.cronSecret = undefined;
    assert.equal(run("Bearer anything"), 503);
    env.cronSecret = "too-short";
    assert.equal(run("Bearer too-short"), 503);
    env.cronSecret = "isolated-fixture-scheduler-secret-0123456789";
    assert.equal(run(), 401);
    assert.equal(run("Bearer wrong"), 401);
    assert.equal(run("Bearer isolated-fixture-scheduler-secret-0123456789"), "next");
  } finally {
    env.cronSecret = original;
  }
});
