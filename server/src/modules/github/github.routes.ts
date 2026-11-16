import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireCronSecret } from "../../middlewares/cron.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { oauthCallback } from "../auth/oauth-callback";
import { GitHubController } from "./github.controller";
import { githubConnectSchema, githubConnectUrlSchema, githubDisconnectSchema, githubPreferencesSchema, githubSyncSchema } from "./github.validation";

const controller = new GitHubController();
export const githubRoutes = Router();

githubRoutes.post("/webhook", asyncHandler(controller.webhook));
githubRoutes.get("/callback", asyncHandler(oauthCallback("github")));
// Scheduler-only: a GitHub Actions schedule (POST) or Vercel Cron (GET) with the CRON_SECRET bearer token.
githubRoutes.get("/cron-sync", requireCronSecret, asyncHandler(controller.scheduledSync));
githubRoutes.post("/cron-sync", requireCronSecret, asyncHandler(controller.scheduledSync));

githubRoutes.use(requireAuth);
githubRoutes.get("/status", asyncHandler(controller.status));
githubRoutes.get("/oauth-url", validate(githubConnectUrlSchema), asyncHandler(controller.oauthUrl));
githubRoutes.post("/connect", validate(githubConnectSchema), asyncHandler(controller.connect));
githubRoutes.patch("/preferences", validate(githubPreferencesSchema), asyncHandler(controller.preferences));
githubRoutes.post("/sync", validate(githubSyncSchema), asyncHandler(controller.sync));
githubRoutes.delete("/disconnect", validate(githubDisconnectSchema), asyncHandler(controller.disconnect));
