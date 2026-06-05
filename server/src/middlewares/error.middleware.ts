import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";

export function errorMiddleware(error: Error, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(500).json({ message: error.message || "Internal server error" });
}
