import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../middlewares/async.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { ApiResponse } from "../../utils/ApiResponse";
import { SearchService, searchQuery } from "./search.service";

export function createSearchRouter(service = new SearchService()) {
  const router = Router();
  router.get("/", requireAuth, validate(z.object({ query: searchQuery })), asyncHandler(async (req, res) => res.json(new ApiResponse(await service.search(req.user!.id, searchQuery.parse(req.query))))));

  return router;
}
export const searchRoutes = createSearchRouter();
