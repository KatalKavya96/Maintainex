import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { OrganizationController } from "./organization.controller";
import { createOrganizationSchema, updateOrganizationSchema } from "./organization.validation";

const controller = new OrganizationController();
export const organizationRoutes = Router();

organizationRoutes.post("/", validate(createOrganizationSchema), asyncHandler(controller.create));
organizationRoutes.get("/", asyncHandler(controller.list));
organizationRoutes.get("/:id", asyncHandler(controller.get));
organizationRoutes.put("/:id", validate(updateOrganizationSchema), asyncHandler(controller.update));
organizationRoutes.delete("/:id", asyncHandler(controller.delete));
