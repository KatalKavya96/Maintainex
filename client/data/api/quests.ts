import { apiRequest, queryString } from "../http";
import type { OrganizationQuestsResponse } from "@/types/explore";
import type { Quest, QuestListResponse, QuestProgressStatus, QuestAuthoringOptions, CreateQuestInput } from "@/types/quest";

export const getQuests = (params?: Record<string, string | number | boolean | undefined>, signal?: AbortSignal) => apiRequest<QuestListResponse>(`/quests${queryString(params)}`, { signal });

export const getQuest = (id: string, signal?: AbortSignal) => apiRequest<Quest>(`/quests/${encodeURIComponent(id)}`, { signal });

export const getQuestAuthoringOptions = () => apiRequest<QuestAuthoringOptions>("/quests/options");

export const createQuest = (data: CreateQuestInput) => apiRequest<Quest>("/quests", { method: "POST", body: JSON.stringify(data) });

export const archiveQuest = (id: string) => apiRequest<Quest>(`/quests/${encodeURIComponent(id)}/archive`, { method: "PATCH" });

export const restoreQuest = (id: string) => apiRequest<Quest>(`/quests/${encodeURIComponent(id)}/restore`, { method: "PATCH" });

export const startQuest = (id: string) => apiRequest<Quest>(`/quests/${encodeURIComponent(id)}/start`, { method: "POST" });

export const updateQuestProgress = (id: string, data: { status: QuestProgressStatus; evidenceUrl?: string; completionNote?: string }) => apiRequest<Quest>(`/quests/${encodeURIComponent(id)}/progress`, { method: "PATCH", body: JSON.stringify(data) });

export const getExploreOrganizationQuests = (slug: string) => apiRequest<OrganizationQuestsResponse>(`/explore/organizations/${encodeURIComponent(slug)}/quests`);
