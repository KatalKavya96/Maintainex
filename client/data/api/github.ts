import { apiRequest, queryString } from "../http";
import type { GitHubPreferences, GitHubStatus, GitHubSyncResult } from "@/types/github";

export const getGitHubStatus = () => apiRequest<GitHubStatus>("/github/status");

export const getGitHubOAuthUrl = (nonce: string) =>
  apiRequest<{ url: string }>(`/github/oauth-url${queryString({ nonce, origin: window.location.origin })}`);

export const connectGitHub = (code: string, nonce: string) =>
  apiRequest<{ connected: boolean; login: string }>("/github/connect", { method: "POST", body: JSON.stringify({ code, nonce }) });

export const updateGitHubPreferences = (preferences: Partial<GitHubPreferences>) =>
  apiRequest<GitHubPreferences>("/github/preferences", { method: "PATCH", body: JSON.stringify(preferences) });

export const syncGitHub = (data?: { since?: string; maxPages?: number; auto?: boolean }) =>
  apiRequest<GitHubSyncResult>("/github/sync", { method: "POST", body: JSON.stringify(data ?? {}) });

export const disconnectGitHub = (removeImported: boolean) =>
  apiRequest<{ connected: boolean; removed: { activities: number; work: number } }>(`/github/disconnect${queryString({ removeImported })}`, { method: "DELETE" });
