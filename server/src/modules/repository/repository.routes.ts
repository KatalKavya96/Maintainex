import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { RepositoryController } from "./repository.controller";
import { createRepositorySchema, updateRepositorySchema } from "./repository.validation";

const controller = new RepositoryController();
export const repositoryRoutes = Router();

repositoryRoutes.use(requireAuth);
repositoryRoutes.post("/", validate(createRepositorySchema), asyncHandler(controller.create));
repositoryRoutes.get("/", asyncHandler(controller.list));
repositoryRoutes.get("/:id", asyncHandler(controller.get));
repositoryRoutes.put("/:id", validate(updateRepositorySchema), asyncHandler(controller.update));
repositoryRoutes.delete("/:id", asyncHandler(controller.delete));
