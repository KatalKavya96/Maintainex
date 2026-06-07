import { Router } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { AiController } from "./ai.controller";
import { coachSchema, contextSchema, reviewNotesSchema } from "./ai.validation";

const controller = new AiController();
export const aiRoutes = Router();

aiRoutes.use(requireAuth);
aiRoutes.get("/report", asyncHandler(controller.weeklyReport));
aiRoutes.post("/coach", validate(coachSchema), asyncHandler(controller.progressCoach));
aiRoutes.get("/plan", asyncHandler(controller.contributionPlan));
aiRoutes.post("/context", validate(contextSchema), asyncHandler(controller.issuePrContext));
aiRoutes.post("/review-notes", validate(reviewNotesSchema), asyncHandler(controller.reviewNotes));
aiRoutes.get("/memory", asyncHandler(controller.maintainerMemory));
