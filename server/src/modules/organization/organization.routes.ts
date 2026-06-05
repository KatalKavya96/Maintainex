import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { requireAdmin, requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { OrganizationController } from "./organization.controller";
import { createOrganizationSchema, updateOrganizationSchema } from "./organization.validation";

const controller = new OrganizationController();
export const organizationRoutes = Router();

organizationRoutes.use(requireAuth);
organizationRoutes.post("/", requireAdmin, validate(createOrganizationSchema), asyncHandler(controller.create));
organizationRoutes.get("/", asyncHandler(controller.list));
organizationRoutes.get("/:id", asyncHandler(controller.get));
organizationRoutes.put("/:id", requireAdmin, validate(updateOrganizationSchema), asyncHandler(controller.update));
organizationRoutes.delete("/:id", requireAdmin, asyncHandler(controller.delete));
