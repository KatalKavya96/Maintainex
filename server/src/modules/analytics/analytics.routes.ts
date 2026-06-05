import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { AnalyticsController } from "./analytics.controller";

const controller = new AnalyticsController();
export const analyticsRoutes = Router();

analyticsRoutes.get("/summary", asyncHandler(controller.summary));
analyticsRoutes.get("/daily", asyncHandler(controller.daily));
analyticsRoutes.get("/weekly", asyncHandler(controller.weekly));
analyticsRoutes.get("/monthly", asyncHandler(controller.monthly));
analyticsRoutes.get("/yearly", asyncHandler(controller.yearly));
analyticsRoutes.get("/repositories", asyncHandler(controller.repositories));
analyticsRoutes.get("/organizations", asyncHandler(controller.organizations));
analyticsRoutes.get("/activity-types", asyncHandler(controller.activityTypes));
