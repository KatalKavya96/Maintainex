import bcrypt from "bcryptjs";
import type { User, UserRole } from "@prisma/client";
import { env } from "../../config/env";
import { clientOriginFor } from "../../config/origins";
import { ApiError } from "../../utils/ApiError";
import { ensureStrongPassword, ensureUsableEmail } from "../../utils/emailValidation";
import { AuthRepository } from "./auth.repository";
import type { AuthUser } from "./auth.types";
import { OAuthAccounts } from "./oauth-accounts";
import { nonceHashFor, readHandoff, signHandoff, signState, type OAuthProvider, type OAuthState } from "./oauth-handoff";
import { exchangeProviderCode, providerConfigured, redirectUriFor, type ProviderExchange } from "./oauth-providers";
import { issueSession, MAX_SESSION_AGE_SECONDS, type SessionClaims } from "./session";
import { AuthThrottle, rules } from "./throttle";
import { uniqueUsername } from "./username";

const INVALID_LOGIN = "Email or password is incorrect. If you signed up with Google or GitHub, use that button instead.";
let timingHash: Promise<string> | null = null;
/** Comparing against a throwaway hash keeps unknown emails as slow as wrong passwords. */
const comparableHash = () => (timingHash ??= bcrypt.hash("maintainex-timing-equaliser", 12));

export class AuthService {
  constructor(
    private repository = new AuthRepository(),
    private accounts = new OAuthAccounts(repository),
    private exchange: ProviderExchange = exchangeProviderCode,
    private throttle = new AuthThrottle()
  ) {}

  async signup(payload: { name: string; email: string; password: string; adminCode?: string }, ip = "unknown") {
    await this.throttle.assertAllowed([rules.signupIp(ip)], "Too many sign-ups from this network");
    await this.throttle.record([rules.signupIp(ip)]);
    const email = await ensureUsableEmail(payload.email);
    ensureStrongPassword(payload.password);
    const existing = await this.repository.findByEmail(email);
    if (existing) throw new ApiError(409, "This email is already registered. Log in instead, or continue with Google/GitHub if you used provider login.");

    const userCount = await this.repository.countUsers();
    const role: UserRole = env.signupAdminCode
      ? payload.adminCode === env.signupAdminCode
        ? "ADMIN"
        : "VIEWER"
      : userCount === 0
        ? "ADMIN"
        : "VIEWER";
    const passwordHash = await bcrypt.hash(payload.password, 12);
    const username = await uniqueUsername(payload.name, email, (name) => this.repository.findByUsername(name));
    const user = await this.repository.create({
      name: payload.name.trim(),
      username,
      email,
      passwordHash,
      passwordSetAt: new Date(),
      role
    });

    return this.authResponse(user);
  }

  async login(payload: { email: string; password: string }, ip = "unknown") {
    const email = payload.email.trim().toLowerCase();
    const limits = [rules.loginPair(email, ip), rules.loginEmail(email), rules.loginIp(ip)];
    await this.throttle.assertAllowed(limits, "Too many sign-in attempts");

    const user = await this.repository.findByEmail(email);
    const hash = user?.passwordSetAt ? user.passwordHash : await comparableHash();
    const valid = (await bcrypt.compare(payload.password, hash)) && Boolean(user?.passwordSetAt);
    if (!user || !valid) {
      await this.throttle.record(limits);
      throw new ApiError(401, INVALID_LOGIN);
    }
    await this.throttle.clear(rules.loginPair(email, ip));
    return this.authResponse(user);
  }

  /** Signs out every device by retiring all tokens issued so far. */
  async logoutEverywhere(userId: string) {
    if (userId === "viewer") return { signedOut: true };
    await this.repository.updateUser(userId, { sessionVersion: { increment: 1 } });
    return { signedOut: true };
  }

  providers() {
    return { google: providerConfigured("google"), github: providerConfigured("github") };
  }

  oauthStart(provider: OAuthProvider, input: { nonce: unknown; origin: unknown; apiBase: string }) {
    const name = provider === "google" ? "Google" : "GitHub";
    if (!providerConfigured(provider)) throw new ApiError(503, `${name} sign-in is not configured yet.`);
    const state = signState({ purpose: "auth-oauth", provider, nonceHash: nonceHashFor(input.nonce), origin: clientOriginFor(input.origin) });
    const redirectUri = redirectUriFor(provider, input.apiBase);
    if (provider === "google") {
      const params = new URLSearchParams({ client_id: env.googleClientId!, redirect_uri: redirectUri, response_type: "code", scope: "openid email profile", state, prompt: "select_account" });
      return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
    }
    const params = new URLSearchParams({ client_id: env.githubClientId!, redirect_uri: redirectUri, scope: env.githubOAuthScopes, state, allow_signup: "true" });
    return { url: `https://github.com/login/oauth/authorize?${params.toString()}` };
  }

  /** Exchanges the provider code and returns a short-lived handoff that only the starting browser can redeem. */
  async oauthComplete(state: OAuthState, code: string, apiBase: string) {
    const profile = await this.exchange(state.provider, code, redirectUriFor(state.provider, apiBase));
    const user = await this.accounts.resolveLogin(profile);
    return signHandoff({ purpose: "oauth-session", nonceHash: state.nonceHash, userId: user.id });
  }

  async oauthSession(code: string, nonce: unknown) {
    const handoff = readHandoff(code, nonce, "oauth-session");
    const user = handoff.userId ? await this.repository.findById(handoff.userId) : null;
    if (!user) throw new ApiError(401, "This sign-in link expired. Please try again.");
    return this.authResponse(user);
  }

  /** Renews the token but never past MAX_SESSION_AGE from the original sign-in. */
  async me(currentUser: AuthUser, claims: SessionClaims = { sessionVersion: 0, authTime: null }) {
    const now = Math.floor(Date.now() / 1000);
    const authTime = claims.authTime ?? now;
    if (now - authTime > MAX_SESSION_AGE_SECONDS) throw new ApiError(401, "Your session ended. Please sign in again.");
    if (currentUser.id === "viewer") return this.viewer(authTime);

    const user = await this.repository.findById(currentUser.id);
    if (!user) throw new ApiError(401, "Session user not found");

    return this.authResponse(user, authTime);
  }

  async startViewer(ip = "unknown") {
    await this.throttle.assertAllowed([rules.viewerIp(ip)], "Too many viewer sessions from this network");
    await this.throttle.record([rules.viewerIp(ip)]);
    return this.viewer();
  }

  viewer(authTime?: number) {
    const user = {
      id: "viewer",
      name: "Viewer",
      username: "viewer",
      email: "viewer@maintainex.local",
      role: "VIEWER" as UserRole,
      emailVerifiedAt: null
    };
    return {
      token: issueSession(user, authTime),
      user
    };
  }

  private authResponse(user: User, authTime?: number) {
    const publicUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt
    };

    return {
      token: issueSession({ ...publicUser, sessionVersion: user.sessionVersion }, authTime),
      user: publicUser
    };
  }
}
