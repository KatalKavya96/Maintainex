import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { ActivityController } from "./activity.controller";
import { createActivitySchema, updateActivitySchema } from "./activity.validation";

const controller = new ActivityController();
export const activityRoutes = Router();

activityRoutes.post("/", validate(createActivitySchema), asyncHandler(controller.create));
activityRoutes.get("/", asyncHandler(controller.list));
activityRoutes.delete("/", asyncHandler(controller.deleteAll));
activityRoutes.get("/:id", asyncHandler(controller.get));
activityRoutes.put("/:id", validate(updateActivitySchema), asyncHandler(controller.update));
activityRoutes.delete("/:id", asyncHandler(controller.delete));
