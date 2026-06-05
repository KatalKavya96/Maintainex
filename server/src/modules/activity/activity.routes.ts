import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { requireAdmin, requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { ActivityController } from "./activity.controller";
import { createActivitySchema, updateActivitySchema } from "./activity.validation";

const controller = new ActivityController();
export const activityRoutes = Router();

activityRoutes.use(requireAuth);
activityRoutes.post("/", requireAdmin, validate(createActivitySchema), asyncHandler(controller.create));
activityRoutes.get("/", asyncHandler(controller.list));
activityRoutes.delete("/", requireAdmin, asyncHandler(controller.deleteAll));
activityRoutes.get("/:id", asyncHandler(controller.get));
activityRoutes.put("/:id", requireAdmin, validate(updateActivitySchema), asyncHandler(controller.update));
activityRoutes.delete("/:id", requireAdmin, asyncHandler(controller.delete));
