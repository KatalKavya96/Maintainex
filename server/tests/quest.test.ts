import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { QuestService, webLink } from "../src/modules/quest/quest.service";
import { createQuestRouter } from "../src/modules/quest/quest.routes";
import { questProgress, questQuery, createQuest } from "../src/modules/quest/quest.validation";
import { SearchService, searchQuery } from "../src/modules/search/search.service";
import { ScheduledWorkService } from "../src/modules/scheduledWork/scheduledWork.service";
import { ScheduledWorkRepository } from "../src/modules/scheduledWork/scheduledWork.repository";
import { errorMiddleware } from "../src/middlewares/error.middleware";
import { env } from "../src/config/env";
import { fixtureQuest, fixtureUser, makeTestDatabase } from "./fixtures";

const member = fixtureUser.id;
test("repeated and concurrent quest starts share one enrollment and one work item", async () => {
  const { db, state } = makeTestDatabase(); const service = new QuestService(db);
  const results = await Promise.all(Array.from({ length: 5 }, () => service.start(member, fixtureQuest.id)));
  assert.equal(state.enrollments.length, 1); assert.equal(state.work.length, 1);
  assert.equal(state.work[0].type, "DOCUMENTATION");
  assert.equal(new Set(results.map((q) => q.progress?.work?.id)).size, 1);
  state.work[0].plan = "Keep this plan";
  await service.start(member, fixtureQuest.id);
  assert.equal(state.work[0].plan, "Keep this plan");
});
test("start retries serialization conflicts and bounds repeated failures", async () => {
  const { db, state } = makeTestDatabase();
  const transact = db.$transaction.bind(db) as any;
  let attempts = 0;
  (db as any).$transaction = async (...args: any[]) => {
    attempts++;
    if (attempts === 1) throw new Prisma.PrismaClientKnownRequestError("conflict", { code: "P2034", clientVersion: "test" });
    return transact(...args);
  };
  await new QuestService(db).start(member, fixtureQuest.id);
  assert.equal(attempts, 2); assert.equal(state.work.length, 1);
  attempts = 0;
  (db as any).$transaction = async () => { attempts++; throw new Prisma.PrismaClientKnownRequestError("conflict", { code: "P2034", clientVersion: "test" }); };
  await assert.rejects(() => new QuestService(db).start(member, fixtureQuest.id), (error: any) => error.statusCode === 409);
  assert.equal(attempts, 4);
});
test("enrollments and work belong to the requesting user", async () => {
  const { db, state } = makeTestDatabase(); const service = new QuestService(db);
  await service.start(member, fixtureQuest.id);
  state.work[0].plan = "Private plan";
  const other = await service.detail("another-user", fixtureQuest.id);
  assert.equal(other.progress, null); assert.equal(other.canManage, false);
  await assert.rejects(() => service.progress("another-user", fixtureQuest.id, { status: "COMPLETED" }), /Start the quest/);
  await service.start("another-user", fixtureQuest.id);
  assert.equal(state.work.length, 2); assert.notEqual(state.work[0].id, state.work[1].id);
});
test("archived quests cannot be newly started but existing contributors retain progress", async () => {
  const { db, state } = makeTestDatabase(); const service = new QuestService(db);
  await service.start(member, fixtureQuest.id); state.quests[0].isActive = false;
  assert.ok((await service.start(member, fixtureQuest.id)).progress?.work);
  await assert.rejects(() => service.start("new-user", fixtureQuest.id), /no longer available/);
});
test("deleted linked work can be restored without losing enrollment evidence", async () => {
  const { db, state } = makeTestDatabase(); const service = new QuestService(db);
  await service.start(member, fixtureQuest.id);
  await service.progress(member, fixtureQuest.id, { status: "COMPLETED", evidenceUrl: "https://github.com/example/repo/pull/2", completionNote: "Manual outcome" });
  state.work.length = 0; state.enrollments[0].scheduledWorkId = null; // ON DELETE SET NULL
  const restored = await service.start(member, fixtureQuest.id);
  assert.equal(state.enrollments.length, 1); assert.equal(state.work.length, 1);
  assert.equal(restored.progress?.status, "COMPLETED"); assert.equal(restored.progress?.work?.status, "DONE");
  assert.equal(restored.progress?.completionNote, "Manual outcome");
});
test("submission, completion and reopening preserve evidence and clear completion timestamps", async () => {
  const { db, state } = makeTestDatabase(); const service = new QuestService(db);
  await service.start(member, fixtureQuest.id);
  const url = "https://github.com/example/repo/pull/2";
  await service.progress(member, fixtureQuest.id, { status: "SUBMITTED", evidenceUrl: url });
  assert.equal(state.enrollments[0].status, "SUBMITTED");
  await service.progress(member, fixtureQuest.id, { status: "COMPLETED", completionNote: "Finished locally" });
  assert.equal(state.work[0].status, "DONE"); assert.ok(state.enrollments[0].completedAt);
  await service.progress(member, fixtureQuest.id, { status: "STARTED" });
  assert.equal(state.work[0].status, "IN_PROGRESS"); assert.equal(state.work[0].completedAt, null);
  assert.equal(state.enrollments[0].completedAt, null); assert.equal(state.enrollments[0].evidenceUrl, url);
});
test("viewer cannot start, submit, author or archive quests", async () => {
  const { db, state } = makeTestDatabase(); const service = new QuestService(db);
  await assert.rejects(() => service.start("viewer", fixtureQuest.id), /Sign in/);
  await assert.rejects(() => service.progress("viewer", fixtureQuest.id, { status: "COMPLETED" }), /Sign in/);
  await assert.rejects(() => service.authoringOptions("viewer"), /Sign in/);
  await assert.rejects(() => service.archive("viewer", fixtureQuest.id), /Sign in/);
  assert.equal(state.enrollments.length, 0);
});
test("saving notes preserves a blocked work state", async () => {
  const { db, state } = makeTestDatabase(); const service = new QuestService(db);
  await service.start(member, fixtureQuest.id); state.work[0].status = "BLOCKED";
  await service.progress(member, fixtureQuest.id, { status: "STARTED", completionNote: "Still waiting for review" });
  assert.equal(state.work[0].status, "BLOCKED");
});
test("quest authoring and archival require organization ownership", async () => {
  const { db } = makeTestDatabase(); const service = new QuestService(db);
  const payload = createQuest.parse({ organizationId: "org-test", repositoryId: "repo-test", title: "Document setup", description: "Document the setup in the guide.", acceptanceCriteria: "Validate the steps.", sourceUrl: "https://github.com/example/repo/issues/2", type: "DOCUMENTATION", difficulty: "EASY" });
  await assert.rejects(() => service.create("another-user", payload), /tracked organizations/);
  await assert.rejects(() => service.create(member, { ...payload, repositoryId: "foreign-repo" }), /active repository/);
  assert.ok((await service.create(member, payload)).id);
  await assert.rejects(() => service.archive("another-user", fixtureQuest.id), /not found/);
  assert.equal((await service.archive(member, fixtureQuest.id)).isActive, false);
  await assert.rejects(() => service.restore("another-user", fixtureQuest.id), /not found/);
  assert.equal((await service.restore(member, fixtureQuest.id)).isActive, true);
});
test("query and progress validation reject unsafe URLs, invented acceptance, and invalid pagination", () => {
  for (const url of ["not a url", "javascript:alert(1)", "file:///tmp/a", "https://name:secret@example.com/path"]) {
    assert.equal(webLink(url), null); assert.equal(questProgress.safeParse({ status: "SUBMITTED", evidenceUrl: url }).success, false);
  }
  assert.equal(questProgress.safeParse({ status: "ACCEPTED" }).success, false);
  assert.equal(questProgress.safeParse({ status: "SUBMITTED" }).success, false);
  assert.equal(questQuery.safeParse({ page: "1.2" }).success, false);
  assert.equal(questQuery.safeParse({ limit: "100000" }).success, false);
  assert.equal(questProgress.safeParse({ status: "COMPLETED" }).success, true);
});
test("detail requests and catalogue joins scope private enrollment and saved state", async () => {
  const { db, calls } = makeTestDatabase(); const service = new QuestService(db);
  await service.detail(member, fixtureQuest.id); await service.list(member, questQuery.parse({ status: "saved" }));
  const detail = calls.find((x) => x.model === "quest" && x.method === "findUnique")!;
  assert.equal(detail.args.include.userQuests.where.userId, member);
  assert.equal(detail.args.include.savedOpportunities.where.userId, member);
  const list = calls.find((x) => x.model === "quest" && x.method === "findMany")!;
  assert.equal(list.args.where.savedOpportunities.some.userId, member);
});
test("archived view is scoped to the author’s tracked organizations", async () => {
  const { db, calls } = makeTestDatabase();
  await new QuestService(db).list(member, questQuery.parse({ status: "archived" }));
  const query = calls.find((x) => x.model === "quest" && x.method === "findMany")!.args.where;
  assert.equal(query.organization.userId, member); assert.equal(query.isActive, false);
});
test("search scopes both private counts and rows, and never searches or selects emails", async () => {
  const { db, calls } = makeTestDatabase();
  const result = await new SearchService(db).search(member, searchQuery.parse({ q: "guide" }));
  for (const model of ["scheduledWork", "pin"]) for (const method of ["count", "findMany"]) {
    assert.equal(calls.find((x) => x.model === model && x.method === method)!.args.where.userId, member);
  }
  assert.ok(calls.filter((x) => x.model === "user").every((x) => !JSON.stringify(x.args).includes("email")));
  assert.ok(result.items.every((x) => x.href.startsWith("/") && !x.href.startsWith("//")));
});
test("partial schedule updates preserve context, plan, source links and notes", async () => {
  let captured: any;
  const repository = { findByIdForUser: async () => ({ id: "work", userId: member, completedAt: null }), update: async (_id: string, data: unknown) => { captured = data; return data; } } as unknown as ScheduledWorkRepository;
  const service = new ScheduledWorkService(repository);
  await service.update(member, "work", { blockers: "Waiting for review" });
  for (const key of ["plan", "context", "itemUrl", "closingNotes"]) assert.equal(captured[key], undefined);
  await service.update(member, "work", { blockers: "" }); assert.equal(captured.blockers, null);
  await service.updateStatus(member, "work", "IN_PROGRESS"); assert.equal(captured.completedAt, null);
});
test("completing and reopening through Schedule synchronizes the linked quest", async () => {
  const { db, state } = makeTestDatabase();
  const quests = new QuestService(db);
  await quests.start(member, fixtureQuest.id);
  const work = new ScheduledWorkService(new ScheduledWorkRepository(db));
  await work.markDone(member, state.work[0].id);
  assert.equal((await quests.detail(member, fixtureQuest.id)).progress?.status, "COMPLETED");
  await work.updateStatus(member, state.work[0].id, "IN_PROGRESS");
  assert.equal((await quests.detail(member, fixtureQuest.id)).progress?.status, "STARTED");
  assert.equal(state.enrollments[0].completedAt, null);
  await assert.rejects(() => work.markDone("another-user", state.work[0].id), /not found/);
});
test("HTTP quest routes enforce authentication, input validation and the start-to-complete flow", async (t) => {
  const { db } = makeTestDatabase(); const app = express(); app.use(express.json()); app.use("/api/quests", createQuestRouter(new QuestService(db))); app.use(errorMiddleware);
  const server = app.listen(0, "127.0.0.1"); await new Promise<void>((resolve) => server.once("listening", resolve));
  t.after(() => new Promise<void>((resolve) => server.close(() => resolve())));
  const port = (server.address() as { port: number }).port;
  const url = `http://127.0.0.1:${port}/api/quests`;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${jwt.sign({ id: member, role: "VIEWER" }, env.jwtSecret)}` };
  assert.equal((await fetch(url)).status, 401);
  assert.equal((await fetch(`${url}?page=-1`, { headers })).status, 400);
  const started = await fetch(`${url}/${fixtureQuest.id}/start`, { method: "POST", headers }); assert.equal(started.status, 200);
  assert.ok((await started.json() as any).data.progress.work.id);
  assert.equal((await fetch(`${url}/${fixtureQuest.id}/progress`, { method: "PATCH", headers, body: JSON.stringify({ status: "SUBMITTED" }) })).status, 400);
  const completed = await fetch(`${url}/${fixtureQuest.id}/progress`, { method: "PATCH", headers, body: JSON.stringify({ status: "COMPLETED", completionNote: "Test completion" }) });
  assert.equal(completed.status, 200); assert.equal((await completed.json() as any).data.progress.status, "COMPLETED");
});
