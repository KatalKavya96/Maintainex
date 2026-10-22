import { apiRequest } from "../http";
import type { GitHubStatus, GitHubSyncResult } from "@/types/github";

export const getGitHubStatus = () => apiRequest<GitHubStatus>("/github/status");

export const getGitHubOAuthUrl = () => apiRequest<{ url: string }>("/github/oauth-url");

export const syncGitHub = (data?: { since?: string; maxPages?: number }) => apiRequest<GitHubSyncResult>("/github/sync", { method: "POST", body: JSON.stringify(data ?? {}) });

export const disconnectGitHub = () => apiRequest<{ connected: boolean }>("/github/disconnect", { method: "DELETE" });
