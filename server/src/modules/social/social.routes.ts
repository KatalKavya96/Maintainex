import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { SocialController } from "./social.controller";

const controller = new SocialController();
export const socialRoutes = Router();

socialRoutes.use(requireAuth);
socialRoutes.get("/feed", asyncHandler(controller.feed));
socialRoutes.get("/leaderboard", asyncHandler(controller.leaderboard));
socialRoutes.get("/notifications", asyncHandler(controller.notifications));
socialRoutes.patch("/notifications/:id/read", asyncHandler(controller.markNotificationRead));
socialRoutes.post("/follow/:userId", asyncHandler(controller.follow));
socialRoutes.delete("/follow/:userId", asyncHandler(controller.unfollow));
socialRoutes.get("/:username/followers", asyncHandler(controller.followers));
socialRoutes.get("/:username/following", asyncHandler(controller.following));
socialRoutes.get("/:username/badges", asyncHandler(controller.badges));
socialRoutes.get("/:username/compare", asyncHandler(controller.compare));
