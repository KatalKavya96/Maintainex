import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { AuthController } from "./auth.controller";
import { loginSchema, oauthCallbackSchema, oauthSessionSchema, oauthUrlSchema, signupSchema } from "./auth.validation";

const controller = new AuthController();
export const authRoutes = Router();

authRoutes.post("/signup", validate(signupSchema), asyncHandler(controller.signup));
authRoutes.post("/login", validate(loginSchema), asyncHandler(controller.login));
authRoutes.get("/oauth/:provider/url", validate(oauthUrlSchema), asyncHandler(controller.oauthUrl));
authRoutes.get("/oauth/:provider/callback", validate(oauthCallbackSchema), asyncHandler(controller.oauthCallback));
authRoutes.post("/oauth/session", validate(oauthSessionSchema), asyncHandler(controller.oauthSession));
authRoutes.get("/me", requireAuth, asyncHandler(controller.me));
authRoutes.post("/viewer", asyncHandler(controller.viewer));
