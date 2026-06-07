import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { AuthProvider, Prisma, User, UserRole } from "@prisma/client";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { ensureStrongPassword, ensureUsableEmail, normalizeEmail } from "../../utils/emailValidation";
import { AuthRepository } from "./auth.repository";
import type { AuthUser } from "./auth.types";

type OAuthProvider = "google" | "github";

type OAuthProfile = {
  provider: AuthProvider;
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  usernameSeed: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
  tokenType?: string;
  rawProfile: Record<string, unknown>;
  githubLogin?: string;
  githubUrl?: string;
};

type GitHubUser = {
  id: number;
  login: string;
  name?: string | null;
  email?: string | null;
  html_url?: string;
};

type GitHubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
};

type GoogleUser = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  picture?: string;
};

export class AuthService {
  constructor(private repository = new AuthRepository()) {}

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
    const username = await this.generateUsername(payload.name, email);
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

  oauthUrl(provider: OAuthProvider) {
    const state = jwt.sign({ provider, purpose: "auth-oauth" }, env.jwtSecret, { expiresIn: "10m" });
    if (provider === "google") {
      if (!env.googleClientId) throw new ApiError(503, "Google login is not configured yet.");
      const params = new URLSearchParams({
        client_id: env.googleClientId,
        redirect_uri: this.oauthRedirectUri("google"),
        response_type: "code",
        scope: "openid email profile",
        state,
        prompt: "select_account"
      });
      return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
    }

    if (!env.githubClientId) throw new ApiError(503, "GitHub login is not configured yet.");
    const params = new URLSearchParams({
      client_id: env.githubClientId,
      redirect_uri: this.oauthRedirectUri("github"),
      scope: env.githubOAuthScopes,
      state,
      allow_signup: "true"
    });
    return { url: `https://github.com/login/oauth/authorize?${params.toString()}` };
  }

  async oauthCallback(provider: OAuthProvider, code: string, state: string) {
    const decoded = jwt.verify(state, env.jwtSecret) as { provider?: OAuthProvider; purpose?: string };
    if (decoded.provider !== provider || decoded.purpose !== "auth-oauth") throw new ApiError(400, "Invalid OAuth state. Please try again.");

    const profile = provider === "google" ? await this.exchangeGoogle(code) : await this.exchangeGithub(code);
    if (!profile.emailVerified) throw new ApiError(400, `${provider === "google" ? "Google" : "GitHub"} did not return a verified email address.`);

    const user = await this.findOrCreateOAuthUser(profile);
    const handoffCode = jwt.sign({ purpose: "oauth-session", userId: user.id }, env.jwtSecret, { expiresIn: "2m" });
    return { code: handoffCode, user };
  }

  async oauthSession(code: string) {
    const decoded = jwt.verify(code, env.jwtSecret) as { purpose?: string; userId?: string };
    if (decoded.purpose !== "oauth-session" || !decoded.userId) throw new ApiError(401, "OAuth session expired. Please try again.");
    const user = await this.repository.findById(decoded.userId);
    if (!user) throw new ApiError(401, "OAuth session user not found.");
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

  private async exchangeGoogle(code: string): Promise<OAuthProfile> {
    if (!env.googleClientId || !env.googleClientSecret) throw new ApiError(503, "Google login is not configured yet.");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.googleClientId,
        client_secret: env.googleClientSecret,
        code,
        redirect_uri: this.oauthRedirectUri("google"),
        grant_type: "authorization_code"
      })
    });
    const token = (await tokenResponse.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string; token_type?: string; error_description?: string };
    if (!tokenResponse.ok || !token.access_token) throw new ApiError(400, token.error_description ?? "Google login failed. Please try again.");

    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` }
    });
    const userinfo = (await userinfoResponse.json()) as GoogleUser;
    if (!userinfoResponse.ok || !userinfo.email) throw new ApiError(400, "Google did not return account email information.");
    return {
      provider: "GOOGLE",
      providerAccountId: userinfo.sub,
      email: normalizeEmail(userinfo.email),
      emailVerified: Boolean(userinfo.email_verified),
      name: userinfo.name ?? userinfo.email.split("@")[0],
      usernameSeed: userinfo.email.split("@")[0],
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : undefined,
      scope: token.scope,
      tokenType: token.token_type,
      rawProfile: userinfo as unknown as Record<string, unknown>
    };
  }

  private async exchangeGithub(code: string): Promise<OAuthProfile> {
    if (!env.githubClientId || !env.githubClientSecret) throw new ApiError(503, "GitHub login is not configured yet.");
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: env.githubClientId,
        client_secret: env.githubClientSecret,
        code,
        redirect_uri: this.oauthRedirectUri("github")
      })
    });
    const token = (await tokenResponse.json()) as { access_token?: string; token_type?: string; scope?: string; error_description?: string };
    if (!tokenResponse.ok || !token.access_token) throw new ApiError(400, token.error_description ?? "GitHub login failed. Please try again.");

    const [user, emails] = await Promise.all([
      this.githubRequest<GitHubUser>("/user", token.access_token),
      this.githubRequest<GitHubEmail[]>("/user/emails", token.access_token)
    ]);
    const primaryEmail = emails.find((email) => email.primary && email.verified) ?? emails.find((email) => email.verified);
    if (!primaryEmail) throw new ApiError(400, "GitHub did not return a verified email address. Verify a primary email in GitHub first.");
    return {
      provider: "GITHUB",
      providerAccountId: String(user.id),
      email: normalizeEmail(primaryEmail.email),
      emailVerified: true,
      name: user.name?.trim() || user.login,
      usernameSeed: user.login,
      accessToken: token.access_token,
      scope: token.scope,
      tokenType: token.token_type,
      rawProfile: { ...user, emails } as unknown as Record<string, unknown>,
      githubLogin: user.login,
      githubUrl: user.html_url
    };
  }

  private async findOrCreateOAuthUser(profile: OAuthProfile) {
    const providerAccount = await prisma.authAccount.findUnique({
      where: { provider_providerAccountId: { provider: profile.provider, providerAccountId: profile.providerAccountId } },
      include: { user: true }
    });
    if (providerAccount) {
      await this.updateAuthAccount(providerAccount.userId, profile);
      if (profile.provider === "GITHUB") await this.upsertGithubIntegration(providerAccount.userId, profile);
      return this.repository.findById(providerAccount.userId).then((next) => next!);
    }

    let user = await this.repository.findByEmail(profile.email);
    if (!user) {
      const userCount = await this.repository.countUsers();
      const role: UserRole = userCount === 0 ? "ADMIN" : "VIEWER";
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
      user = await this.repository.create({
        name: profile.name,
        username: await this.generateUsername(profile.usernameSeed, profile.email),
        email: profile.email,
        passwordHash,
        passwordSetAt: null,
        role,
        githubUrl: profile.githubUrl ?? undefined
      });
    }

    const userProvider = await prisma.authAccount.findUnique({ where: { userId_provider: { userId: user.id, provider: profile.provider } } });
    if (userProvider && userProvider.providerAccountId !== profile.providerAccountId) {
      throw new ApiError(409, `This Maintainex account is already linked to a different ${profile.provider.toLowerCase()} account.`);
    }
    await this.updateAuthAccount(user.id, profile);
    if (profile.provider === "GITHUB") await this.upsertGithubIntegration(user.id, profile);
    return this.repository.findById(user.id).then((next) => next!);
  }

  private updateAuthAccount(userId: string, profile: OAuthProfile) {
    return prisma.authAccount.upsert({
      where: { provider_providerAccountId: { provider: profile.provider, providerAccountId: profile.providerAccountId } },
      update: {
        providerEmail: profile.email,
        accessTokenEncrypted: this.encryptToken(profile.accessToken),
        refreshTokenEncrypted: profile.refreshToken ? this.encryptToken(profile.refreshToken) : undefined,
        expiresAt: profile.expiresAt,
        scope: profile.scope,
        tokenType: profile.tokenType,
        profile: profile.rawProfile as Prisma.InputJsonObject
      },
      create: {
        userId,
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
        providerEmail: profile.email,
        accessTokenEncrypted: this.encryptToken(profile.accessToken),
        refreshTokenEncrypted: profile.refreshToken ? this.encryptToken(profile.refreshToken) : undefined,
        expiresAt: profile.expiresAt,
        scope: profile.scope,
        tokenType: profile.tokenType,
        profile: profile.rawProfile as Prisma.InputJsonObject
      }
    });
  }

  private upsertGithubIntegration(userId: string, profile: OAuthProfile) {
    return prisma.gitHubIntegration.upsert({
      where: { userId },
      update: {
        githubUserId: profile.providerAccountId,
        login: profile.githubLogin ?? profile.usernameSeed,
        accessTokenEncrypted: this.encryptToken(profile.accessToken),
        tokenType: profile.tokenType,
        scope: profile.scope
      },
      create: {
        userId,
        githubUserId: profile.providerAccountId,
        login: profile.githubLogin ?? profile.usernameSeed,
        accessTokenEncrypted: this.encryptToken(profile.accessToken),
        tokenType: profile.tokenType,
        scope: profile.scope
      }
    });
  }

  private async githubRequest<T>(path: string, accessToken: string): Promise<T> {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": env.githubApiVersion,
        "User-Agent": "Maintainex"
      }
    });
    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as { message?: string };
      throw new ApiError(response.status, error.message ?? "GitHub request failed.");
    }
    return response.json() as Promise<T>;
  }

  private oauthRedirectUri(provider: OAuthProvider) {
    if (provider === "google" && env.googleRedirectUri) return env.googleRedirectUri;
    if (provider === "github") {
      return env.githubAuthRedirectUri ?? env.githubRedirectUri ?? `http://localhost:${env.port}/api/github/callback`;
    }
    return `http://localhost:${env.port}/api/auth/oauth/${provider}/callback`;
  }

  private encryptToken(token: string) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
  }

  private encryptionKey() {
    return crypto.createHash("sha256").update(env.githubTokenEncryptionKey ?? env.jwtSecret).digest();
  }

  private async generateUsername(name: string, email: string) {
    const base =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      email
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      "user";

    let username = base;
    let suffix = 1;
    while (await this.repository.findByUsername(username)) {
      suffix += 1;
      username = `${base}-${suffix}`;
    }
    return username;
  }
}
