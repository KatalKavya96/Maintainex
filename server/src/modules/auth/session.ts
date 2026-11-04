import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import type { AuthUser } from "./auth.types";

export const MAX_SESSION_AGE_SECONDS = 30 * 24 * 60 * 60;

export type SessionClaims = { sessionVersion: number; authTime: number | null };
type Signable = { id: string; name: string; username: string; email: string; role: UserRole; sessionVersion?: number };

/** HTTP and realtime use the same verified identity and algorithm contract. */
export function verifySession(token: unknown): AuthUser {
  if (typeof token !== "string" || !token) throw new Error("Session required");
  const value = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
  if (typeof value === "string" || !value.id || typeof value.id !== "string" ||
      typeof value.name !== "string" || typeof value.username !== "string" ||
      typeof value.email !== "string" || !["ADMIN", "VIEWER"].includes(value.role) ||
      typeof value.exp !== "number") {
    throw new Error("Invalid session claims");
  }
  return { id: value.id, name: value.name, username: value.username, email: value.email, role: value.role };
}

/** Tokens issued before versioning carry neither claim and count as version 0 with an unknown sign-in time. */
export function sessionClaims(token: string): SessionClaims {
  const value = jwt.decode(token) as { sv?: unknown; at?: unknown } | null;
  return {
    sessionVersion: typeof value?.sv === "number" ? value.sv : 0,
    authTime: typeof value?.at === "number" ? value.at : null
  };
}

/** `authTime` is when the person last proved who they are; renewals keep it so a session cannot live forever. */
export function issueSession(user: Signable, authTime = Math.floor(Date.now() / 1000)) {
  const claims = { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role, sv: user.sessionVersion ?? 0, at: authTime };
  return jwt.sign(claims, env.jwtSecret, { algorithm: "HS256", expiresIn: "7d" });
}

/** Replaceable so isolated tests never reach a configured database. */
export const sessionVersions = {
  lookup: async (userId: string): Promise<number | null> =>
    (await prisma.user.findUnique({ where: { id: userId }, select: { sessionVersion: true } }))?.sessionVersion ?? null
};
