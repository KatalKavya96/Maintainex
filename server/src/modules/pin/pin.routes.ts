import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { PinController } from "./pin.controller";
import { createPinSchema, favoritePinSchema, reorderPinsSchema, updatePinSchema } from "./pin.validation";

const controller = new PinController();
export const pinRoutes = Router();

pinRoutes.use(requireAuth);
pinRoutes.post("/", validate(createPinSchema), asyncHandler(controller.create));
pinRoutes.get("/", asyncHandler(controller.list));
pinRoutes.patch("/reorder", validate(reorderPinsSchema), asyncHandler(controller.reorder));
pinRoutes.get("/:id", asyncHandler(controller.get));
pinRoutes.put("/:id", validate(updatePinSchema), asyncHandler(controller.update));
pinRoutes.delete("/:id", asyncHandler(controller.delete));
pinRoutes.patch("/:id/opened", asyncHandler(controller.opened));
pinRoutes.patch("/:id/favorite", validate(favoritePinSchema), asyncHandler(controller.favorite));
