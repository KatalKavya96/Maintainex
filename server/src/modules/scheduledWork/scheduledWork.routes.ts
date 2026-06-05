import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { ScheduledWorkController } from "./scheduledWork.controller";
import { createScheduledWorkSchema, updateScheduledWorkSchema, updateScheduledWorkStatusSchema } from "./scheduledWork.validation";

const controller = new ScheduledWorkController();
export const scheduledWorkRoutes = Router();

scheduledWorkRoutes.use(requireAuth);
scheduledWorkRoutes.post("/", validate(createScheduledWorkSchema), asyncHandler(controller.create));
scheduledWorkRoutes.get("/", asyncHandler(controller.list));
scheduledWorkRoutes.get("/:id", asyncHandler(controller.get));
scheduledWorkRoutes.put("/:id", validate(updateScheduledWorkSchema), asyncHandler(controller.update));
scheduledWorkRoutes.delete("/:id", asyncHandler(controller.delete));
scheduledWorkRoutes.patch("/:id/status", validate(updateScheduledWorkStatusSchema), asyncHandler(controller.updateStatus));
scheduledWorkRoutes.patch("/:id/mark-done", asyncHandler(controller.markDone));
scheduledWorkRoutes.patch("/:id/mark-blocked", asyncHandler(controller.markBlocked));
