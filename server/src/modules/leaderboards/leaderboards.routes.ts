import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { requireAuth, requireMember } from "../../middlewares/auth.middleware";
import { LeaderboardsController } from "./leaderboards.controller";

const controller = new LeaderboardsController();
export const leaderboardsRoutes = Router();
export const openSourceIndexRoutes = Router();
export const collectionRoutes = Router();

leaderboardsRoutes.use(requireAuth, requireMember);
leaderboardsRoutes.get("/top-contributors", asyncHandler(controller.topContributors));
leaderboardsRoutes.get("/top-organizations", asyncHandler(controller.topOrganizations));
leaderboardsRoutes.get("/active-repositories", asyncHandler(controller.activeRepositories));

openSourceIndexRoutes.use(requireAuth);
openSourceIndexRoutes.get("/", asyncHandler(controller.openSourceIndex));

collectionRoutes.use(requireAuth);
collectionRoutes.get("/", asyncHandler(controller.collections));
