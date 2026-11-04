import { apiRequest, queryString } from "../http";

export type OAuthProviderName = "google" | "github";
export type OAuthProviders = Record<OAuthProviderName, boolean>;

export const getOAuthProviders = () => apiRequest<OAuthProviders>("/auth/providers");

export const getOAuthUrl = (provider: OAuthProviderName, nonce: string) =>
  apiRequest<{ url: string }>(`/auth/oauth/${provider}/url${queryString({ nonce, origin: window.location.origin })}`);

export const logoutEverywhere = () => apiRequest<{ signedOut: boolean }>("/auth/logout-everywhere", { method: "POST" });
