import assert from "node:assert/strict";
import { test } from "node:test";
import { GitHubAuthError, GitHubClient, GitHubRateLimitError } from "../src/modules/github/github.api";
import { GitHubRecords } from "../src/modules/github/github.records";
import { GitHubService } from "../src/modules/github/github.service";
import { encryptToken } from "../src/utils/tokenCrypto";

const repo = { id: 7, node_id: "R_7", name: "widgets", full_name: "acme/widgets", html_url: "https://github.com/acme/widgets", owner: { id: 1, login: "acme", node_id: "O_1" } };
const item = (overrides: any = {}) => ({
  id: 1, node_id: "PR_1", number: 12, title: "Fix the docs", html_url: "https://github.com/acme/widgets/pull/12", state: "open",
  created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-02T00:00:00Z", repository_url: "https://api.github.com/repos/acme/widgets", pull_request: { html_url: "x" }, ...overrides
});

function memoryDb() {
  const rows = { activity: [] as any[], scheduledWork: [] as any[], tombstones: [] as any[] };
  const byKey = (list: any[], where: any) => { const k = where.userId_source_externalId; return list.find((r) => r.userId === k.userId && r.source === k.source && r.externalId === k.externalId) ?? null; };
  const table = (list: any[]) => ({
    findUnique: async ({ where }: any) => byKey(list, where),
    create: async ({ data }: any) => { const row = { id: `row-${list.length + 1}`, userEditedAt: null, ...data }; list.push(row); return row; },
    update: async ({ where, data }: any) => Object.assign(list.find((r) => r.id === where.id), data)
  });
  const db: any = {
    activity: table(rows.activity),
    scheduledWork: table(rows.scheduledWork),
    syncTombstone: { findUnique: async ({ where }: any) => byKey(rows.tombstones, where) },
    organization: { findUnique: async () => null, create: async ({ data }: any) => ({ id: "org", ...data }) },
    repository: { findUnique: async () => null, create: async ({ data }: any) => ({ id: "repo", ...data }) }
  };
  return { db, rows };
}

const response = (status: number, body: unknown, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers });

test("search results resolve their repository from repository_url, once per sync", async () => {
  const calls: string[] = [];
  const client = new GitHubClient("token", async (url) => { calls.push(url); return response(200, repo); });
  assert.equal((await client.repoFor(item()))?.full_name, "acme/widgets");
  await client.repoFor(item({ node_id: "PR_2" }));
  assert.deepEqual(calls, ["https://api.github.com/repos/acme/widgets"]);
  assert.equal(await client.repoFor({ repository_url: "https://api.github.com/repositories/99" }), null);
});

test("GitHub credential and rate-limit failures are recognised", async () => {
  await assert.rejects(new GitHubClient("t", async () => response(401, {})).request("/user"), GitHubAuthError);
  const limited = new GitHubClient("t", async () => response(403, { message: "rate limit" }, { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1893456000" }));
  await assert.rejects(limited.request("/search/issues"), (error) => error instanceof GitHubRateLimitError && error.resetAt?.getUTCFullYear() === 2030);
});

test("sync refreshes status on records the user edited but never their content or notes", async () => {
  const { db, rows } = memoryDb();
  const records = new GitHubRecords(db);
  assert.equal(await records.upsertActivity("u", repo as any, item() as any, "PR_RAISED", "github:prRaised:PR_1"), "created");
  Object.assign(rows.activity[0], { title: "My better title", notes: "My notes", userEditedAt: new Date() });
  assert.equal(await records.upsertActivity("u", repo as any, item({ title: "Upstream title", state: "closed", merged_at: "2026-10-03T00:00:00Z" }) as any, "PR_RAISED", "github:prRaised:PR_1"), "updated");
  assert.equal(rows.activity[0].title, "My better title");
  assert.equal(rows.activity[0].notes, "My notes");
  assert.equal(rows.activity[0].status, "MERGED");
});

test("unedited imported records follow GitHub, and deleted ones stay deleted", async () => {
  const { db, rows } = memoryDb();
  const records = new GitHubRecords(db);
  await records.upsertActivity("u", repo as any, item() as any, "PR_RAISED", "github:prRaised:PR_1");
  await records.upsertActivity("u", repo as any, item({ title: "Renamed upstream" }) as any, "PR_RAISED", "github:prRaised:PR_1");
  assert.equal(rows.activity[0].title, "Renamed upstream");
  rows.tombstones.push({ userId: "u", source: "GITHUB_SYNC", externalId: "github:prRaised:PR_9" });
  assert.equal(await records.upsertActivity("u", repo as any, item({ node_id: "PR_9" }) as any, "PR_RAISED", "github:prRaised:PR_9"), "deleted-by-user");
  assert.equal(rows.activity.length, 1);
});

test("assigned issues can be finished by GitHub but never pulled back to planned", async () => {
  const { db, rows } = memoryDb();
  const records = new GitHubRecords(db);
  await records.upsertAssignedIssue("u", repo as any, item({ pull_request: undefined }) as any);
  rows.scheduledWork[0].status = "IN_PROGRESS";
  await records.upsertAssignedIssue("u", repo as any, item({ pull_request: undefined }) as any);
  assert.equal(rows.scheduledWork[0].status, "IN_PROGRESS");
  await records.upsertAssignedIssue("u", repo as any, item({ pull_request: undefined, state: "closed" }) as any);
  assert.equal(rows.scheduledWork[0].status, "DONE");
  assert.equal(await records.upsertAssignedIssue("u", repo as any, item({ node_id: "I_closed", pull_request: undefined, state: "closed" }) as any), "updated");
  assert.equal(rows.scheduledWork.length, 1);
});

function serviceFixture(integration: any, client: any) {
  const updates: any[] = [];
  let locked = false;
  const db: any = {
    gitHubIntegration: {
      findUnique: async () => integration,
      updateMany: async () => { if (locked) return { count: 0 }; locked = true; return { count: 1 }; },
      update: async ({ data }: any) => { updates.push(data); if (data.syncStartedAt === null) locked = false; Object.assign(integration, data); return integration; }
    }
  };
  const records: any = { ensureRepository: async () => ({}), upsertActivity: async () => "created", upsertAssignedIssue: async () => "created" };
  return { service: new GitHubService(db, records, {} as any, () => client, {} as any), updates, lock: () => { locked = true; } };
}

const integration = (overrides: any = {}) => ({
  userId: "u", login: "owner-gh", accessTokenEncrypted: encryptToken("gho_fixture"), lastSyncedAt: null, syncCursor: null, needsReconnect: false,
  autoSync: true, importPullRequests: true, importReviews: false, importIssues: false, importComments: false, importAssignedIssues: false, importRepositories: false, ...overrides
});

test("automatic sync respects the user's switch, freshness and an in-flight run", async () => {
  const client = { truncated: false, searchIssues: async () => [item()], repoFor: async () => repo, userRepos: async () => [] };
  assert.equal((await serviceFixture(integration({ autoSync: false }), client).service.sync("u", { auto: true })).reason, "auto-sync-off");
  assert.equal((await serviceFixture(integration({ lastSyncedAt: new Date() }), client).service.sync("u", { auto: true })).reason, "up-to-date");
  const busy = serviceFixture(integration(), client);
  busy.lock();
  assert.equal((await busy.service.sync("u", { auto: true })).reason, "already-running");
  await assert.rejects(busy.service.sync("u"), /already running/);
});

test("only enabled imports run, and a finished sync records its time and clears errors", async () => {
  const queries: string[] = [];
  const client = { truncated: false, searchIssues: async (q: string) => { queries.push(q); return [item()]; }, repoFor: async () => repo, userRepos: async () => [] };
  const { service, updates } = serviceFixture(integration({ lastSyncError: "old" }), client);
  const result = await service.sync("u");
  assert.equal(queries.length, 2);
  assert.ok(queries.every((q) => q.startsWith("author:owner-gh type:pr")));
  assert.equal(result.created, 2);
  assert.equal(updates.at(-1).lastSyncError, null);
  assert.ok(updates.at(-1).lastSyncedAt instanceof Date);
});

test("revoked access asks for reconnection; rate limits keep progress and explain when to retry", async () => {
  const revoked = serviceFixture(integration(), { truncated: false, searchIssues: async () => { throw new GitHubAuthError("revoked"); } });
  await assert.rejects(revoked.service.sync("u"), /Reconnect GitHub/);
  assert.equal(revoked.updates.at(-1).needsReconnect, true);
  assert.equal(revoked.updates.at(-1).syncStartedAt, null);
  assert.equal((await revoked.service.sync("u", { auto: true })).reason, "needs-reconnect");

  const limited = serviceFixture(integration(), { truncated: false, searchIssues: async () => { throw new GitHubRateLimitError(new Date("2026-11-04T10:30:00Z")); } });
  await assert.rejects(limited.service.sync("u"), /rate limit.*10:30 UTC/);
  assert.equal(limited.updates.at(-1).lastSyncedAt, undefined);
});
