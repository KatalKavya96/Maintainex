import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { AuthController } from "./auth.controller";
import { loginSchema, signupSchema } from "./auth.validation";

const controller = new AuthController();
export const authRoutes = Router();

authRoutes.post("/signup", validate(signupSchema), asyncHandler(controller.signup));
authRoutes.post("/login", validate(loginSchema), asyncHandler(controller.login));
authRoutes.get("/me", requireAuth, asyncHandler(controller.me));
authRoutes.post("/viewer", asyncHandler(controller.viewer));
