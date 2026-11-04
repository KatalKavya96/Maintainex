import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import type { AuthUser } from "./auth.types";

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
