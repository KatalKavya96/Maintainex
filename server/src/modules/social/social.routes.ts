import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { requireAuth, requireMember } from "../../middlewares/auth.middleware";
import { SocialController } from "./social.controller";

const controller = new SocialController();
export const socialRoutes = Router();

socialRoutes.use(requireAuth);
socialRoutes.get("/feed", asyncHandler(controller.feed));
socialRoutes.get("/leaderboard", requireMember, asyncHandler(controller.leaderboard));
socialRoutes.get("/notifications", asyncHandler(controller.notifications));
socialRoutes.patch("/notifications/:id/read", asyncHandler(controller.markNotificationRead));
socialRoutes.get("/activities/:activityId/engagement", requireMember, asyncHandler(controller.engagement));
socialRoutes.post("/activities/:activityId/reactions", requireMember, asyncHandler(controller.react));
socialRoutes.delete("/activities/:activityId/reactions/:type", requireMember, asyncHandler(controller.unreact));
socialRoutes.get("/activities/:activityId/comments", requireMember, asyncHandler(controller.comments));
socialRoutes.post("/activities/:activityId/comments", requireMember, asyncHandler(controller.comment));
socialRoutes.delete("/activities/:activityId/comments/:commentId", requireMember, asyncHandler(controller.deleteComment));
socialRoutes.post("/activities/:activityId/bookmark", requireMember, asyncHandler(controller.bookmark));
socialRoutes.delete("/activities/:activityId/bookmark", requireMember, asyncHandler(controller.unbookmark));
socialRoutes.post("/activities/:activityId/share", requireMember, asyncHandler(controller.share));
socialRoutes.post("/follow/:userId", requireMember, asyncHandler(controller.follow));
socialRoutes.delete("/follow/:userId", requireMember, asyncHandler(controller.unfollow));
socialRoutes.get("/:username/followers", requireMember, asyncHandler(controller.followers));
socialRoutes.get("/:username/following", requireMember, asyncHandler(controller.following));
socialRoutes.get("/:username/badges", requireMember, asyncHandler(controller.badges));
socialRoutes.get("/:username/compare", requireMember, asyncHandler(controller.compare));
