import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { GitHubController } from "./github.controller";
import { githubCallbackSchema, githubSyncSchema } from "./github.validation";

const controller = new GitHubController();
export const githubRoutes = Router();

githubRoutes.post("/webhook", asyncHandler(controller.webhook));
githubRoutes.get("/callback", validate(githubCallbackSchema), asyncHandler(controller.callback));

githubRoutes.use(requireAuth);
githubRoutes.get("/status", asyncHandler(controller.status));
githubRoutes.get("/oauth-url", asyncHandler(controller.oauthUrl));
githubRoutes.post("/sync", validate(githubSyncSchema), asyncHandler(controller.sync));
githubRoutes.delete("/disconnect", asyncHandler(controller.disconnect));
