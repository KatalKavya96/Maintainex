const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:5001/api";
  }

  return "/api";
};

const queryString = (params?: Record<string, string | number | boolean | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const value = query.toString();
  return value ? `?${value}` : "";
};

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("maintainex.token") : null;
  const response = await fetch(`${getApiUrl()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `API request failed: ${response.status}` }));
    throw new Error(error.message ?? `API request failed: ${response.status}`);
  }

  const json = await response.json();
  return json.data as T;
}

import type { PinInput, PinListResponse } from "@/types/pin";
import type { ProfileDashboard, ProfileSummary, ProfileUpdateInput, ProfileUser, UsernameAvailability } from "@/types/profile";
import type { ScheduledWorkInput, ScheduledWorkListResponse, ScheduledWorkStatus } from "@/types/scheduledWork";
import type { Badge, FeedItem, FollowRecord, Goal, GoalInput, LeaderboardEntry, NotificationItem } from "@/types/social";

export const getPins = (params?: Record<string, string | number | boolean | undefined>) => apiRequest<PinListResponse>(`/pins${queryString(params)}`);
export const getPinById = (id: string) => apiRequest<PinListResponse["items"][number]>(`/pins/${id}`);
export const createPin = (data: PinInput) => apiRequest<PinListResponse["items"][number]>("/pins", { method: "POST", body: JSON.stringify(data) });
export const updatePin = (id: string, data: Partial<PinInput>) => apiRequest<PinListResponse["items"][number]>(`/pins/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deletePin = (id: string) => apiRequest<null>(`/pins/${id}`, { method: "DELETE" });
export const toggleFavoritePin = (id: string, isFavorite?: boolean) => apiRequest<PinListResponse["items"][number]>(`/pins/${id}/favorite`, { method: "PATCH", body: JSON.stringify({ isFavorite }) });
export const markPinOpened = (id: string) => apiRequest<PinListResponse["items"][number]>(`/pins/${id}/opened`, { method: "PATCH" });
export const reorderPins = (items: { id: string; sortOrder: number }[]) => apiRequest<unknown>("/pins/reorder", { method: "PATCH", body: JSON.stringify({ items }) });

export const getScheduledWork = (params?: Record<string, string | number | boolean | undefined>) => apiRequest<ScheduledWorkListResponse>(`/scheduled-work${queryString(params)}`);
export const getScheduledWorkById = (id: string) => apiRequest<ScheduledWorkListResponse["items"][number]>(`/scheduled-work/${id}`);
export const createScheduledWork = (data: ScheduledWorkInput) => apiRequest<ScheduledWorkListResponse["items"][number]>("/scheduled-work", { method: "POST", body: JSON.stringify(data) });
export const updateScheduledWork = (id: string, data: Partial<ScheduledWorkInput>) => apiRequest<ScheduledWorkListResponse["items"][number]>(`/scheduled-work/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteScheduledWork = (id: string) => apiRequest<null>(`/scheduled-work/${id}`, { method: "DELETE" });
export const updateScheduledWorkStatus = (id: string, status: ScheduledWorkStatus) => apiRequest<ScheduledWorkListResponse["items"][number]>(`/scheduled-work/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const markScheduledWorkDone = (id: string) => apiRequest<ScheduledWorkListResponse["items"][number]>(`/scheduled-work/${id}/mark-done`, { method: "PATCH" });
export const markScheduledWorkBlocked = (id: string) => apiRequest<ScheduledWorkListResponse["items"][number]>(`/scheduled-work/${id}/mark-blocked`, { method: "PATCH" });

export const getProfiles = () => apiRequest<ProfileSummary[]>("/profiles");
export const getProfileDashboard = (userId: string) => apiRequest<ProfileDashboard>(`/profiles/${userId}`);
export const getProfileByUsername = (username: string) => apiRequest<ProfileDashboard>(`/profiles/username/${username}`);
export const checkUsernameAvailability = (username: string) => apiRequest<UsernameAvailability>(`/profiles/username-availability${queryString({ username })}`);
export const updateProfile = (data: ProfileUpdateInput) => apiRequest<ProfileUser>("/profiles/me", { method: "PUT", body: JSON.stringify(data) });
export const changePassword = (data: { currentPassword: string; newPassword: string }) => apiRequest<{ changed: boolean }>("/profiles/password", { method: "PATCH", body: JSON.stringify(data) });
export const resetWorkspaceData = (password: string) => apiRequest<Record<string, number>>("/profiles/reset-workspace", { method: "POST", body: JSON.stringify({ password }) });

export const followUser = (userId: string) => apiRequest<{ following: boolean }>(`/social/follow/${userId}`, { method: "POST" });
export const unfollowUser = (userId: string) => apiRequest<{ following: boolean }>(`/social/follow/${userId}`, { method: "DELETE" });
export const getFollowers = (username: string) => apiRequest<FollowRecord[]>(`/social/${username}/followers`);
export const getFollowing = (username: string) => apiRequest<FollowRecord[]>(`/social/${username}/following`);
export const getFeed = (params?: Record<string, string | number | boolean | undefined>) => apiRequest<FeedItem[]>(`/social/feed${queryString(params)}`);
export const getLeaderboard = (params?: Record<string, string | number | boolean | undefined>) => apiRequest<LeaderboardEntry[]>(`/social/leaderboard${queryString(params)}`);
export const getBadges = (username: string) => apiRequest<Badge[]>(`/social/${username}/badges`);
export const getNotifications = () => apiRequest<NotificationItem[]>("/social/notifications");
export const markNotificationRead = (id: string) => apiRequest<unknown>(`/social/notifications/${id}/read`, { method: "PATCH" });

export const getGoals = () => apiRequest<Goal[]>("/goals");
export const createGoal = (data: GoalInput) => apiRequest<Goal>("/goals", { method: "POST", body: JSON.stringify(data) });
export const updateGoal = (id: string, data: Partial<GoalInput>) => apiRequest<Goal>(`/goals/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteGoal = (id: string) => apiRequest<unknown>(`/goals/${id}`, { method: "DELETE" });
