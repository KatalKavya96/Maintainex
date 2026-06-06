import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { ProfileController } from "./profile.controller";
import { changePasswordSchema, resetWorkspaceSchema, updateProfileSchema, usernameAvailabilitySchema } from "./profile.validation";

const controller = new ProfileController();
export const profileRoutes = Router();

profileRoutes.use(requireAuth);
profileRoutes.get("/", asyncHandler(controller.list));
profileRoutes.get("/username-availability", validate(usernameAvailabilitySchema), asyncHandler(controller.usernameAvailability));
profileRoutes.put("/me", validate(updateProfileSchema), asyncHandler(controller.updateMe));
profileRoutes.patch("/password", validate(changePasswordSchema), asyncHandler(controller.changePassword));
profileRoutes.post("/reset-workspace", validate(resetWorkspaceSchema), asyncHandler(controller.resetWorkspace));
profileRoutes.get("/username/:username", asyncHandler(controller.getByUsername));
profileRoutes.get("/:userId", asyncHandler(controller.get));
