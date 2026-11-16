import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

const MIN_SECRET_LENGTH = 32;
const digest = (value: string) => crypto.createHash("sha256").update(value).digest();

/**
 * Guards scheduler-only routes. Callers send `Authorization: Bearer <CRON_SECRET>`, which is
 * also what Vercel Cron sends when CRON_SECRET is set. Hashing first gives equal-length
 * buffers, so the comparison stays constant-time whatever the caller sends.
 */
export function requireCronSecret(req: Request, _res: Response, next: NextFunction) {
  const secret = env.cronSecret;
  if (!secret || secret.length < MIN_SECRET_LENGTH) return next(new ApiError(503, "Scheduled sync is not configured."));
  const given = req.header("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!crypto.timingSafeEqual(digest(given), digest(secret))) return next(new ApiError(401, "Invalid scheduler credentials"));
  return next();
}
