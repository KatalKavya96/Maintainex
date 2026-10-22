import type { ActivityStatus, ActivityType, ClosingReason, ReviewType } from "@/types/activity";
import type { PinCategory } from "@/types/pin";
import type { Priority, ScheduledWorkStatus, ScheduledWorkType, WorkDifficulty } from "@/types/scheduledWork";

export const activityTypes: ActivityType[] = [
  "PR_REVIEWED",
  "PR_RAISED",
  "ISSUE_RAISED",
  "PR_CLOSED",
  "ISSUE_CLOSED",
  "COMMENTED",
  "MERGED",
  "OTHER"
];

export const statuses: ActivityStatus[] = [
  "OPEN",
  "CLOSED",
  "MERGED",
  "REVIEWED",
  "APPROVED",
  "CHANGES_REQUESTED",
  "COMMENTED",
  "DRAFT",
  "OTHER"
];

export const reviewTypes: ReviewType[] = [
  "COMMENTED",
  "APPROVED",
  "CHANGES_REQUESTED",
  "REQUESTED_REVIEW",
  "NOT_APPLICABLE"
];

export const closingReasons: ClosingReason[] = [
  "DUPLICATE",
  "STALE",
  "INVALID",
  "COMPLETED",
  "FIXED_IN_ANOTHER_PR",
  "NOT_REPRODUCIBLE",
  "AUTHOR_CLOSED",
  "MAINTAINER_CLOSED",
  "NOT_APPLICABLE",
  "OTHER"
];

export const labelize = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

export const pinCategories: PinCategory[] = ["REPOSITORY", "ISSUE", "PULL_REQUEST", "DOCUMENTATION", "PROJECT_BOARD", "ORGANIZATION", "WEBSITE", "OTHER"];
export const scheduledWorkTypes: ScheduledWorkType[] = ["PR_REVIEW", "ISSUE_WORK", "PR_TO_RAISE", "ISSUE_TO_RAISE", "BUG_FIX", "FEATURE_BUILD", "DOCUMENTATION", "TESTING", "OTHER"];
export const scheduledWorkStatuses: ScheduledWorkStatus[] = ["PLANNED", "IN_PROGRESS", "BLOCKED", "DONE", "CANCELLED", "POSTPONED"];
export const priorities: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
export const workDifficulties: WorkDifficulty[] = ["EASY", "MEDIUM", "HARD"];
