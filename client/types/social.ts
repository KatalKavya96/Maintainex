import type { Activity } from "@/types/activity";
import type { ProfileUser } from "@/types/profile";

export type ActivityReactionType = "LIKE" | "FIRE" | "CLAP" | "EYES";
export type ActivityShareTarget = "COPY_LINK" | "X" | "LINKEDIN" | "OTHER";

export type ActivityEngagement = {
  reactionCounts: Record<ActivityReactionType, number>;
  viewerReactionTypes: ActivityReactionType[];
  commentCount: number;
  bookmarkCount: number;
  shareCount: number;
  viewerBookmarked: boolean;
};

export type ActivityComment = {
  id: string;
  activityId: string;
  userId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  user: ProfileUser;
};

export type GoalMetric = "PR_RAISED" | "PR_REVIEWED" | "ISSUE_RAISED" | "ISSUE_CLOSED" | "REPO_CONTRIBUTIONS" | "TOTAL_ACTIVITY" | "STREAK";
export type GoalPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";

export type Goal = {
  id: string;
  title: string;
  metric: GoalMetric;
  target: number;
  period: GoalPeriod;
  progress: number;
  percent: number;
  isCompleted: boolean;
  completedAt?: string | null;
};

export type GoalInput = {
  title: string;
  metric: GoalMetric;
  target: number;
  period: GoalPeriod;
};

export type FeedItem = {
  id: string;
  kind: "ACTIVITY";
  createdAt: string;
  text: string;
  user: ProfileUser;
  activity: Activity;
  engagement: ActivityEngagement;
};

export type FollowRecord = {
  createdAt: string;
  follower?: ProfileUser;
  following?: ProfileUser;
};

export type Badge = {
  name: string;
  earned: boolean;
};

export type LeaderboardEntry = {
  user: ProfileUser;
  counts: Record<string, number>;
  scheduledDone: number;
  streak: number;
  score: number;
};

export type NotificationItem = {
  id: string;
  type: "SYSTEM" | "SOCIAL" | "GOAL" | "SCHEDULE" | "BADGE" | "REMINDER";
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
  actor?: ProfileUser | null;
};
