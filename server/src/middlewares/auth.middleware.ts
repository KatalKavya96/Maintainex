import type { NextFunction, Request, Response } from "express";
import type { AuthUser } from "../modules/auth/auth.types";
import { sessionClaims, sessionVersions, verifySession, type SessionClaims } from "../modules/auth/session";
import { ApiError, signInRequired } from "../utils/ApiError";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      session?: SessionClaims;
    }
  }
}

const READ_ONLY = new Set(["GET", "HEAD", "OPTIONS"]);

export const isAnonymousViewer = (user?: AuthUser) => user?.id === "viewer";

/** Verifies the token, rejects sessions revoked by a version bump, and keeps viewer mode read-only. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return next(new ApiError(401, "Authentication required"));

  let user: AuthUser;
  try {
    user = verifySession(token);
  } catch {
    return next(new ApiError(401, "Invalid or expired token"));
  }
  const claims = sessionClaims(token);
  req.user = user;
  req.session = claims;

  if (isAnonymousViewer(user)) {
    if (!READ_ONLY.has(req.method)) return next(signInRequired("Viewer mode is read-only. Sign up or sign in to save changes."));
    return next();
  }
  sessionVersions
    .lookup(user.id)
    .then((current) => {
      if (current === null || current !== claims.sessionVersion) return next(new ApiError(401, "Your session ended. Please sign in again."));
      next();
    })
    .catch(next);
}

/** For pages about other people: the anonymous viewer session must not browse the member directory. */
export function requireMember(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new ApiError(401, "Authentication required"));
  if (isAnonymousViewer(req.user)) return next(signInRequired("Sign in to see other contributors."));
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw new ApiError(401, "Authentication required");
  if (req.user.role !== "ADMIN") throw new ApiError(403, "Admin access required");
  next();
}
