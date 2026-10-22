import { apiRequest, queryString } from "../http";
import type { ExploreOrganization, ExploreOrganizationsResponse, OrganizationContributorsResponse, OrganizationRepositoriesResponse, SavedOpportunitiesResponse } from "@/types/explore";

export const getExploreOrganizations = (params?: Record<string, string | number | boolean | undefined>, signal?: AbortSignal) => apiRequest<ExploreOrganizationsResponse>(`/explore/organizations${queryString(params)}`, { signal });

export const getExploreOrganization = (slug: string) => apiRequest<ExploreOrganization>(`/explore/organizations/${encodeURIComponent(slug)}`);

export const getExploreOrganizationContributors = (slug: string) => apiRequest<OrganizationContributorsResponse>(`/explore/organizations/${encodeURIComponent(slug)}/contributors`);

export const getExploreOrganizationRepositories = (slug: string) => apiRequest<OrganizationRepositoriesResponse>(`/explore/organizations/${encodeURIComponent(slug)}/repositories`);

export const toggleSavedOpportunity = (data: { type: "ORGANIZATION" | "REPOSITORY" | "QUEST" | "ISSUE"; organizationId?: string; repositoryId?: string; questId?: string; externalUrl?: string }) =>
  apiRequest<{ saved: boolean }>("/explore/saved", { method: "POST", body: JSON.stringify(data) });

export const getSavedOpportunities = () => apiRequest<SavedOpportunitiesResponse>("/explore/saved");
