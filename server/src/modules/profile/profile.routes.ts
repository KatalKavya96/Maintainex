import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { ProfileController } from "./profile.controller";

const controller = new ProfileController();
export const profileRoutes = Router();

profileRoutes.use(requireAuth);
profileRoutes.get("/", asyncHandler(controller.list));
profileRoutes.get("/:userId", asyncHandler(controller.get));
