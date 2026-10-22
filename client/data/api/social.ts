import { apiRequest, queryString } from "../http";
import type { ActivityComment, ActivityEngagement, ActivityReactionType, ActivityShareTarget, Badge, FeedItem, FollowRecord, NotificationItem } from "@/types/social";

export const followUser = (userId: string) => apiRequest<{ following: boolean }>(`/social/follow/${userId}`, { method: "POST" });

export const unfollowUser = (userId: string) => apiRequest<{ following: boolean }>(`/social/follow/${userId}`, { method: "DELETE" });

export const getFollowers = (username: string) => apiRequest<FollowRecord[]>(`/social/${username}/followers`);

export const getFollowing = (username: string) => apiRequest<FollowRecord[]>(`/social/${username}/following`);

export const getFeed = (params?: Record<string, string | number | boolean | undefined>) => apiRequest<FeedItem[]>(`/social/feed${queryString(params)}`);

export const getBadges = (username: string) => apiRequest<Badge[]>(`/social/${username}/badges`);

export const getNotifications = () => apiRequest<NotificationItem[]>("/social/notifications");

export const markNotificationRead = (id: string) => apiRequest<unknown>(`/social/notifications/${id}/read`, { method: "PATCH" });

export const getActivityEngagement = (activityId: string) => apiRequest<ActivityEngagement>(`/social/activities/${activityId}/engagement`);

export const reactToActivity = (activityId: string, type: ActivityReactionType) => apiRequest<ActivityEngagement>(`/social/activities/${activityId}/reactions`, { method: "POST", body: JSON.stringify({ type }) });

export const unreactToActivity = (activityId: string, type: ActivityReactionType) => apiRequest<ActivityEngagement>(`/social/activities/${activityId}/reactions/${type}`, { method: "DELETE" });

export const getActivityComments = (activityId: string) => apiRequest<{ comments: ActivityComment[]; engagement: ActivityEngagement }>(`/social/activities/${activityId}/comments`);

export const commentOnActivity = (activityId: string, body: string) => apiRequest<ActivityComment>(`/social/activities/${activityId}/comments`, { method: "POST", body: JSON.stringify({ body }) });

export const deleteActivityComment = (activityId: string, commentId: string) => apiRequest<{ deleted: boolean }>(`/social/activities/${activityId}/comments/${commentId}`, { method: "DELETE" });

export const bookmarkActivity = (activityId: string) => apiRequest<ActivityEngagement>(`/social/activities/${activityId}/bookmark`, { method: "POST" });

export const unbookmarkActivity = (activityId: string) => apiRequest<ActivityEngagement>(`/social/activities/${activityId}/bookmark`, { method: "DELETE" });

export const shareActivity = (activityId: string, target: ActivityShareTarget = "COPY_LINK") => apiRequest<{ shareUrl: string; engagement: ActivityEngagement }>(`/social/activities/${activityId}/share`, { method: "POST", body: JSON.stringify({ target }) });
