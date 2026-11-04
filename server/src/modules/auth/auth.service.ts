import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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
import { uniqueUsername } from "./username";

export class AuthService {
  constructor(
    private repository = new AuthRepository(),
    private accounts = new OAuthAccounts(repository),
    private exchange: ProviderExchange = exchangeProviderCode
  ) {}

  async signup(payload: { name: string; email: string; password: string; adminCode?: string }) {
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

  async login(payload: { email: string; password: string }) {
    const email = await ensureUsableEmail(payload.email);
    const user = await this.repository.findByEmail(email);
    if (!user) throw new ApiError(404, "No Maintainex account exists for this email. Sign up first, or continue with Google/GitHub.");
    if (!user.passwordSetAt) throw new ApiError(401, "This account uses Google/GitHub login. Continue with the provider you used to create it.");

    const isValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isValid) throw new ApiError(401, "Password is incorrect for this email.");

    return this.authResponse(user);
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

  async me(currentUser: AuthUser) {
    if (currentUser.id === "viewer") return this.viewer();

    const user = await this.repository.findById(currentUser.id);
    if (!user) throw new ApiError(401, "Session user not found");

    return this.authResponse(user);
  }

  viewer() {
    const user = {
      id: "viewer",
      name: "Viewer",
      username: "viewer",
      email: "viewer@maintainex.local",
      role: "VIEWER" as UserRole,
      emailVerifiedAt: null
    };
    return {
      token: this.sign(user),
      user
    };
  }

  private authResponse(user: User) {
    const publicUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt
    };

    return {
      token: this.sign(publicUser),
      user: publicUser
    };
  }

  private sign(user: { id: string; name: string; username: string; email: string; role: UserRole }) {
    return jwt.sign(user, env.jwtSecret, { expiresIn: "7d" });
  }
}
