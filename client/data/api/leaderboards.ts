import { apiRequest, queryString } from "../http";
import type { LeaderboardEntry } from "@/types/social";
import type { ActiveRepositoryEntry, CollectionEntry, OpenSourceIndexResponse, TopContributorEntry, TopOrganizationEntry } from "@/types/leaderboards";

export const getLeaderboard = (params?: Record<string, string | number | boolean | undefined>) => apiRequest<LeaderboardEntry[]>(`/social/leaderboard${queryString(params)}`);

export const getTopContributors = () => apiRequest<TopContributorEntry[]>("/leaderboards/top-contributors");

export const getTopOrganizations = () => apiRequest<TopOrganizationEntry[]>("/leaderboards/top-organizations");

export const getActiveRepositories = () => apiRequest<ActiveRepositoryEntry[]>("/leaderboards/active-repositories");

export const getOpenSourceIndex = () => apiRequest<OpenSourceIndexResponse>("/open-source-index");

export const getCollections = () => apiRequest<CollectionEntry[]>("/collections");
