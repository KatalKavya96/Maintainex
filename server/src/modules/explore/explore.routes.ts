import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { ExploreController } from "./explore.controller";

const controller = new ExploreController();
export const exploreRoutes = Router();

exploreRoutes.use(requireAuth);
exploreRoutes.get("/organizations", asyncHandler(controller.organizations));
exploreRoutes.get("/organizations/:slug", asyncHandler(controller.organization));
exploreRoutes.get("/organizations/:slug/contributors", asyncHandler(controller.contributors));
exploreRoutes.get("/organizations/:slug/repositories", asyncHandler(controller.repositories));
exploreRoutes.get("/organizations/:slug/quests", asyncHandler(controller.quests));
exploreRoutes.get("/saved", asyncHandler(controller.saved));
exploreRoutes.post("/saved", asyncHandler(controller.save));
