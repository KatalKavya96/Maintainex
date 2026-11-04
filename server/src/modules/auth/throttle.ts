import crypto from "crypto";
import type { Request } from "express";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";

const MINUTE = 60_000;

export type Rule = { scope: string; subject: string; limit: number; windowMs: number; lockMs?: number };

/** Rules for each sensitive action; failures on one email are capped per address and per network. */
export const rules = {
  loginPair: (email: string, ip: string): Rule => ({ scope: "login-pair", subject: `${email}|${ip}`, limit: 5, windowMs: 15 * MINUTE, lockMs: 15 * MINUTE }),
  loginEmail: (email: string): Rule => ({ scope: "login-email", subject: email, limit: 20, windowMs: 60 * MINUTE, lockMs: 30 * MINUTE }),
  loginIp: (ip: string): Rule => ({ scope: "login-ip", subject: ip, limit: 50, windowMs: 15 * MINUTE }),
  signupIp: (ip: string): Rule => ({ scope: "signup-ip", subject: ip, limit: 10, windowMs: 60 * MINUTE }),
  viewerIp: (ip: string): Rule => ({ scope: "viewer-ip", subject: ip, limit: 30, windowMs: 60 * MINUTE })
};

/** Vercel sets x-real-ip to the caller; elsewhere forwarded headers are client-controlled and ignored. */
export function clientIp(req: Request) {
  if (process.env.VERCEL) return req.get("x-real-ip") ?? req.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  return req.socket.remoteAddress ?? "unknown";
}

const keyFor = (rule: Rule) => `${rule.scope}:${crypto.createHmac("sha256", env.jwtSecret).update(rule.subject.toLowerCase()).digest("hex")}`;
const wait = (until: Date) => Math.max(1, Math.ceil((until.getTime() - Date.now()) / MINUTE));

/** Fixed-window counters stored in the database so limits hold across serverless instances. */
export class AuthThrottle {
  constructor(private db: PrismaClient = prisma) {}

  async assertAllowed(rulesToCheck: Rule[], message = "Too many attempts") {
    const rows = await this.db.authThrottle.findMany({ where: { key: { in: rulesToCheck.map(keyFor) } } });
    const now = Date.now();
    for (const rule of rulesToCheck) {
      const row = rows.find((item) => item.key === keyFor(rule));
      if (!row) continue;
      if (row.lockedUntil && row.lockedUntil.getTime() > now) throw new ApiError(429, `${message}. Try again in ${wait(row.lockedUntil)} min.`);
      const windowEnd = new Date(row.windowStartedAt.getTime() + rule.windowMs);
      if (windowEnd.getTime() > now && row.count >= rule.limit) throw new ApiError(429, `${message}. Try again in ${wait(windowEnd)} min.`);
    }
  }

  async record(rulesToRecord: Rule[]) {
    const now = new Date();
    for (const rule of rulesToRecord) {
      const key = keyFor(rule);
      const row = await this.db.authThrottle.findUnique({ where: { key } });
      const fresh = !row || row.windowStartedAt.getTime() + rule.windowMs <= now.getTime();
      const count = fresh ? 1 : row.count + 1;
      const lockedUntil = rule.lockMs && count >= rule.limit ? new Date(now.getTime() + rule.lockMs) : null;
      await this.db.authThrottle.upsert({
        where: { key },
        update: { count, lockedUntil, ...(fresh ? { windowStartedAt: now } : {}) },
        create: { key, count, lockedUntil, windowStartedAt: now }
      });
    }
  }

  async clear(rule: Rule) {
    await this.db.authThrottle.deleteMany({ where: { key: keyFor(rule) } });
  }
}
