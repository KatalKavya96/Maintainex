import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";

export function errorMiddleware(error: Error, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  // Unexpected errors can contain database URLs, query text or provider responses.
  return res.status(500).json({ message: "Something went wrong. Please try again." });
}
