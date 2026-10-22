import { apiRequest, queryString } from "../http";
import type { PinInput, PinListResponse } from "@/types/pin";

export const getPins = (params?: Record<string, string | number | boolean | undefined>) => apiRequest<PinListResponse>(`/pins${queryString(params)}`);

export const getPinById = (id: string) => apiRequest<PinListResponse["items"][number]>(`/pins/${id}`);

export const createPin = (data: PinInput) => apiRequest<PinListResponse["items"][number]>("/pins", { method: "POST", body: JSON.stringify(data) });

export const updatePin = (id: string, data: Partial<PinInput>) => apiRequest<PinListResponse["items"][number]>(`/pins/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deletePin = (id: string) => apiRequest<null>(`/pins/${id}`, { method: "DELETE" });

export const toggleFavoritePin = (id: string, isFavorite?: boolean) => apiRequest<PinListResponse["items"][number]>(`/pins/${id}/favorite`, { method: "PATCH", body: JSON.stringify({ isFavorite }) });

export const markPinOpened = (id: string) => apiRequest<PinListResponse["items"][number]>(`/pins/${id}/opened`, { method: "PATCH" });

export const reorderPins = (items: { id: string; sortOrder: number }[]) => apiRequest<unknown>("/pins/reorder", { method: "PATCH", body: JSON.stringify({ items }) });
