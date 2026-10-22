// Isolated visual-test API. Uses in-memory fixtures, never DATABASE_URL.
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { createQuestRouter } from "../src/modules/quest/quest.routes";
import { QuestService } from "../src/modules/quest/quest.service";
import { createSearchRouter } from "../src/modules/search/search.routes";
import { SearchService } from "../src/modules/search/search.service";
import { errorMiddleware } from "../src/middlewares/error.middleware";
import { env } from "../src/config/env";
import { fixtureOrganization, fixtureRepository, fixtureUser, makeTestDatabase } from "./fixtures";

const { db, state } = makeTestDatabase();
env.jwtSecret = "maintainex-local-fixture-only";
const app = express();
app.use(cors({ origin: "http://maintainex-preview.localhost:3107", credentials: true }));
app.use(express.json());
const token = jwt.sign(fixtureUser, env.jwtSecret);
const ok = (res: express.Response, data: unknown) => res.json({ data });
app.post("/api/auth/viewer", (_req, res) => ok(res, { user: fixtureUser, token }));
app.get("/api/auth/me", (_req, res) => ok(res, { user: fixtureUser, token }));
app.get("/api/activities", (_req, res) => ok(res, { items: [] }));
app.get(["/api/social/feed", "/api/social/notifications", "/api/goals"], (_req, res) => ok(res, []));
app.get("/api/explore/organizations", (_req, res) => ok(res, { items: [{ ...fixtureOrganization, programs: [], techStack: ["TypeScript"], maintianexScore: 0, scoreLabel: "No data", activeReposCount: 1, openQuestsCount: state.quests.filter((q) => q.isActive).length, averageReviewTimeDays: null, topRepository: null, isSaved: false }], pagination: { page: 1, limit: 12, total: 1, totalPages: 1 } }));
app.post("/api/explore/saved", (req, res) => {
  const index = state.saved.findIndex((x) => x.questId === req.body.questId);
  if (index >= 0) state.saved.splice(index, 1); else state.saved.push({ id: `saved-${state.saved.length}`, userId: fixtureUser.id, questId: req.body.questId, type: "QUEST" });
  ok(res, { saved: index < 0 });
});
app.get("/api/scheduled-work", (_req, res) => ok(res, { items: state.work, total: state.work.length, page: 1, limit: 100 }));
app.get("/api/scheduled-work/:id", (req, res) => { const work = state.work.find((x) => x.id === req.params.id); const enrollment = state.enrollments.find((x) => x.scheduledWorkId === work?.id); if (!work) return res.status(404).json({ message: "Work not found" }); ok(res, { ...work, userQuest: enrollment ? { questId: enrollment.questId } : null }); });
app.put("/api/scheduled-work/:id", (req, res) => { const work = state.work.find((x) => x.id === req.params.id); if (!work) return res.status(404).json({ message: "Work not found" }); Object.assign(work, req.body); ok(res, work); });
app.patch("/api/scheduled-work/:id/mark-blocked", (req, res) => { const work = state.work.find((x) => x.id === req.params.id); if (!work) return res.status(404).json({ message: "Work not found" }); work.status = "BLOCKED"; ok(res, work); });
app.use("/api/quests", createQuestRouter(new QuestService(db)));
app.use("/api/search", createSearchRouter(new SearchService(db)));
app.use(errorMiddleware);
app.listen(5107, "127.0.0.1", () => process.stdout.write("Isolated fixture API listening on 127.0.0.1:5107\n"));
