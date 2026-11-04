import type { AuthProvider } from "@prisma/client";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { normalizeEmail } from "../../utils/emailValidation";
import type { OAuthProvider } from "./oauth-handoff";

export type OAuthProfile = {
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
  avatarUrl?: string;
};

export type ProviderExchange = (provider: OAuthProvider, code: string, redirectUri: string) => Promise<OAuthProfile>;

type GitHubUser = { id: number; login: string; name?: string | null; html_url?: string; avatar_url?: string };
type GitHubEmail = { email: string; primary: boolean; verified: boolean };
type GoogleUser = { sub: string; email: string; email_verified: boolean; name?: string; picture?: string };
type TokenResponse = { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string; token_type?: string; error_description?: string };

export const providerConfigured = (provider: OAuthProvider) =>
  provider === "google" ? Boolean(env.googleClientId && env.googleClientSecret) : Boolean(env.githubClientId && env.githubClientSecret);

export async function githubApi<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${accessToken}`, "X-GitHub-Api-Version": env.githubApiVersion, "User-Agent": "Maintainex" }
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { message?: string };
    throw new ApiError(response.status === 401 ? 401 : 502, `GitHub: ${error.message ?? `request failed (${response.status})`}`);
  }
  return response.json() as Promise<T>;
}

export async function exchangeGithubCode(code: string, redirectUri: string) {
  if (!providerConfigured("github")) throw new ApiError(503, "GitHub sign-in is not configured yet.");
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: env.githubClientId, client_secret: env.githubClientSecret, code, redirect_uri: redirectUri })
  });
  const token = (await response.json().catch(() => ({}))) as TokenResponse;
  if (!response.ok || !token.access_token) throw new ApiError(400, token.error_description ?? "GitHub sign-in failed. Please try again.");
  return token as TokenResponse & { access_token: string };
}

async function exchangeGoogle(code: string, redirectUri: string): Promise<OAuthProfile> {
  if (!providerConfigured("google")) throw new ApiError(503, "Google sign-in is not configured yet.");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: env.googleClientId!, client_secret: env.googleClientSecret!, code, redirect_uri: redirectUri, grant_type: "authorization_code" })
  });
  const token = (await response.json().catch(() => ({}))) as TokenResponse;
  if (!response.ok || !token.access_token) throw new ApiError(400, token.error_description ?? "Google sign-in failed. Please try again.");

  const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } });
  const user = (await userinfoResponse.json().catch(() => ({}))) as GoogleUser;
  if (!userinfoResponse.ok || !user.email || !user.sub) throw new ApiError(400, "Google did not return your account email.");
  return {
    provider: "GOOGLE",
    providerAccountId: user.sub,
    email: normalizeEmail(user.email),
    emailVerified: Boolean(user.email_verified),
    name: user.name?.trim() || user.email.split("@")[0],
    usernameSeed: user.email.split("@")[0],
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : undefined,
    scope: token.scope,
    tokenType: token.token_type,
    rawProfile: user as unknown as Record<string, unknown>,
    avatarUrl: user.picture
  };
}

async function exchangeGithub(code: string, redirectUri: string): Promise<OAuthProfile> {
  const token = await exchangeGithubCode(code, redirectUri);
  const [user, emails] = await Promise.all([
    githubApi<GitHubUser>("/user", token.access_token),
    githubApi<GitHubEmail[]>("/user/emails", token.access_token)
  ]);
  const email = emails.find((item) => item.primary && item.verified) ?? emails.find((item) => item.verified);
  if (!email) throw new ApiError(400, "GitHub did not return a verified email. Verify your primary email on GitHub, then try again.");
  return {
    provider: "GITHUB",
    providerAccountId: String(user.id),
    email: normalizeEmail(email.email),
    emailVerified: true,
    name: user.name?.trim() || user.login,
    usernameSeed: user.login,
    accessToken: token.access_token,
    scope: token.scope,
    tokenType: token.token_type,
    rawProfile: { id: user.id, login: user.login, name: user.name, html_url: user.html_url, avatar_url: user.avatar_url },
    githubLogin: user.login,
    githubUrl: user.html_url,
    avatarUrl: user.avatar_url
  };
}

export const exchangeProviderCode: ProviderExchange = (provider, code, redirectUri) =>
  provider === "google" ? exchangeGoogle(code, redirectUri) : exchangeGithub(code, redirectUri);

/** One callback per provider; GitHub OAuth apps allow a single callback, so login and connect share it. */
export function redirectUriFor(provider: OAuthProvider, apiBase: string) {
  if (provider === "google") return env.googleRedirectUri ?? `${apiBase}/api/auth/oauth/google/callback`;
  return env.githubAuthRedirectUri ?? env.githubRedirectUri ?? `${apiBase}/api/github/callback`;
}
