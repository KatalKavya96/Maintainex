import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middlewares/async.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { ApiResponse } from "../../utils/ApiResponse";
import { QuestService } from "./quest.service";
import { createQuest, questProgress, questQuery } from "./quest.validation";

export function createQuestRouter(service = new QuestService()) {
  const router = Router();
  router.use(requireAuth);
  router.get("/options", asyncHandler(async (req, res) => res.json(new ApiResponse(await service.authoringOptions(req.user!.id)))));
  router.post("/", validate(z.object({ body: createQuest })), asyncHandler(async (req, res) => res.status(201).json(new ApiResponse(await service.create(req.user!.id, createQuest.parse(req.body))))));
  router.get("/", validate(z.object({ query: questQuery })), asyncHandler(async (req, res) => res.json(new ApiResponse(await service.list(req.user!.id, questQuery.parse(req.query))))));
  router.get("/:id", asyncHandler(async (req, res) => res.json(new ApiResponse(await service.detail(req.user!.id, req.params.id)))));
  router.post("/:id/start", asyncHandler(async (req, res) => res.json(new ApiResponse(await service.start(req.user!.id, req.params.id)))));
  router.patch("/:id/archive", asyncHandler(async (req, res) => res.json(new ApiResponse(await service.archive(req.user!.id, req.params.id)))));
  router.patch("/:id/restore", asyncHandler(async (req, res) => res.json(new ApiResponse(await service.restore(req.user!.id, req.params.id)))));
  router.patch("/:id/progress", validate(z.object({ body: questProgress })), asyncHandler(async (req, res) => res.json(new ApiResponse(await service.progress(req.user!.id, req.params.id, questProgress.parse(req.body))))));

  return router;
}
export const questRoutes = createQuestRouter();
