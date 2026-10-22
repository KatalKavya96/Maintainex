import { apiRequest, queryString } from "../http";
import type { ScheduledWorkInput, ScheduledWorkListResponse, ScheduledWorkStatus } from "@/types/scheduledWork";

export const getScheduledWork = (params?: Record<string, string | number | boolean | undefined>) => apiRequest<ScheduledWorkListResponse>(`/scheduled-work${queryString(params)}`);

export const getScheduledWorkById = (id: string) => apiRequest<ScheduledWorkListResponse["items"][number]>(`/scheduled-work/${id}`);

export const createScheduledWork = (data: ScheduledWorkInput) => apiRequest<ScheduledWorkListResponse["items"][number]>("/scheduled-work", { method: "POST", body: JSON.stringify(data) });

export const updateScheduledWork = (id: string, data: Partial<ScheduledWorkInput>) => apiRequest<ScheduledWorkListResponse["items"][number]>(`/scheduled-work/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteScheduledWork = (id: string) => apiRequest<null>(`/scheduled-work/${id}`, { method: "DELETE" });

export const updateScheduledWorkStatus = (id: string, status: ScheduledWorkStatus) => apiRequest<ScheduledWorkListResponse["items"][number]>(`/scheduled-work/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });

export const markScheduledWorkDone = (id: string) => apiRequest<ScheduledWorkListResponse["items"][number]>(`/scheduled-work/${id}/mark-done`, { method: "PATCH" });

export const markScheduledWorkBlocked = (id: string) => apiRequest<ScheduledWorkListResponse["items"][number]>(`/scheduled-work/${id}/mark-blocked`, { method: "PATCH" });
