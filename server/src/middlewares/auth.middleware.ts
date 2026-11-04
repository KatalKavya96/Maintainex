import type { NextFunction, Request, Response } from "express";
import type { AuthUser } from "../modules/auth/auth.types";
import { verifySession } from "../modules/auth/session";
import { ApiError } from "../utils/ApiError";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new ApiError(401, "Authentication required");

  try {
    req.user = verifySession(token);
    next();
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw new ApiError(401, "Authentication required");
  if (req.user.role !== "ADMIN") throw new ApiError(403, "Admin access required");
  next();
}

