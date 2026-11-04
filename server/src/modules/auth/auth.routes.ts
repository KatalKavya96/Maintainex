import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { AuthController } from "./auth.controller";
import { loginSchema, oauthSessionSchema, oauthUrlSchema, signupSchema } from "./auth.validation";
import { oauthCallback } from "./oauth-callback";

const controller = new AuthController();
export const authRoutes = Router();

authRoutes.post("/signup", validate(signupSchema), asyncHandler(controller.signup));
authRoutes.post("/login", validate(loginSchema), asyncHandler(controller.login));
authRoutes.get("/providers", asyncHandler(controller.providers));
authRoutes.get("/oauth/:provider/url", validate(oauthUrlSchema), asyncHandler(controller.oauthUrl));
authRoutes.get("/oauth/google/callback", asyncHandler(oauthCallback("google")));
authRoutes.get("/oauth/github/callback", asyncHandler(oauthCallback("github")));
authRoutes.post("/oauth/session", validate(oauthSessionSchema), asyncHandler(controller.oauthSession));
authRoutes.get("/me", requireAuth, asyncHandler(controller.me));
authRoutes.post("/viewer", asyncHandler(controller.viewer));
authRoutes.post("/logout-everywhere", requireAuth, asyncHandler(controller.logoutEverywhere));
