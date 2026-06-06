import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { GoalController } from "./goal.controller";

const controller = new GoalController();
export const goalRoutes = Router();

goalRoutes.use(requireAuth);
goalRoutes.get("/", asyncHandler(controller.list));
goalRoutes.post("/", asyncHandler(controller.create));
goalRoutes.put("/:id", asyncHandler(controller.update));
goalRoutes.delete("/:id", asyncHandler(controller.delete));
