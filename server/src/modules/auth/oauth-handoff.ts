import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";

export type OAuthProvider = "google" | "github";
export type OAuthPurpose = "auth-oauth" | "github-oauth";

export type OAuthState = {
  purpose: OAuthPurpose;
  provider: OAuthProvider;
  nonceHash: string;
  origin: string;
  userId?: string;
};

type Handoff = { purpose: string; nonceHash: string; userId?: string; token?: string; githubUserId?: string; login?: string; scope?: string; tokenType?: string };

const hash = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

/** The browser keeps the nonce; only its hash travels through the provider, so a stolen code is useless elsewhere. */
export function nonceHashFor(nonce: unknown) {
  if (typeof nonce !== "string" || nonce.length < 16 || nonce.length > 200) {
    throw new ApiError(400, "Sign-in could not start. Refresh the page and try again.");
  }
  return hash(nonce);
}

export const signState = (state: OAuthState) => jwt.sign(state, env.jwtSecret, { algorithm: "HS256", expiresIn: "10m" });

export function readState(value: unknown): OAuthState | null {
  if (typeof value !== "string" || !value) return null;
  try {
    const state = jwt.verify(value, env.jwtSecret, { algorithms: ["HS256"] }) as Partial<OAuthState>;
    if (!state.purpose || !state.provider || !state.nonceHash || !state.origin) return null;
    return state as OAuthState;
  } catch {
    return null;
  }
}

export const signHandoff = (payload: Handoff) => jwt.sign(payload, env.jwtSecret, { algorithm: "HS256", expiresIn: "2m" });

export function readHandoff(code: string, nonce: unknown, purpose: string): Handoff {
  let payload: Handoff;
  try {
    payload = jwt.verify(code, env.jwtSecret, { algorithms: ["HS256"] }) as Handoff;
  } catch {
    throw new ApiError(401, "This sign-in link expired. Please try again.");
  }
  const expected = Buffer.from(payload.nonceHash ?? "");
  const actual = Buffer.from(typeof nonce === "string" ? hash(nonce) : "");
  if (payload.purpose !== purpose || expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    throw new ApiError(401, "This sign-in was started in a different browser or tab. Please start again here.");
  }
  return payload;
}

/** Turns a provider's `?error=` redirect into a sentence a person can act on. */
export function providerErrorMessage(provider: OAuthProvider, query: Record<string, unknown>) {
  const name = provider === "google" ? "Google" : "GitHub";
  const error = typeof query.error === "string" ? query.error : "";
  if (error === "access_denied") return `${name} access was cancelled. Nothing was changed.`;
  if (error === "redirect_uri_mismatch") return `${name} sign-in is misconfigured (callback URL mismatch). Contact the workspace administrator.`;
  if (error) return `${name} returned an error: ${String(query.error_description ?? error).slice(0, 160)}`;
  if (typeof query.code !== "string" || !query.code) return `${name} did not return an authorization code. Please try again.`;
  return null;
}
