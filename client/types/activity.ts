export type ActivityType =
  | "PR_REVIEWED"
  | "PR_RAISED"
  | "ISSUE_RAISED"
  | "PR_CLOSED"
  | "ISSUE_CLOSED"
  | "COMMENTED"
  | "MERGED"
  | "OTHER";

export type ActivityStatus =
  | "OPEN"
  | "CLOSED"
  | "MERGED"
  | "REVIEWED"
  | "APPROVED"
  | "CHANGES_REQUESTED"
  | "COMMENTED"
  | "DRAFT"
  | "OTHER";

export type ReviewType =
  | "COMMENTED"
  | "APPROVED"
  | "CHANGES_REQUESTED"
  | "REQUESTED_REVIEW"
  | "NOT_APPLICABLE";

export type ClosingReason =
  | "DUPLICATE"
  | "STALE"
  | "INVALID"
  | "COMPLETED"
  | "FIXED_IN_ANOTHER_PR"
  | "NOT_REPRODUCIBLE"
  | "AUTHOR_CLOSED"
  | "MAINTAINER_CLOSED"
  | "NOT_APPLICABLE"
  | "OTHER";

export interface Activity {
  id: string;
  date: string;
  activityType: ActivityType;
  organizationName: string;
  repositoryName: string;
  title: string;
  number: string;
  link: string;
  status: ActivityStatus;
  reviewType: ReviewType;
  closingReason: ClosingReason;
  description?: string;
  notes?: string;
  tags: string[];
  source?: "MANUAL" | "GITHUB_SYNC" | "IMPORTED";
  externalId?: string | null;
  githubNodeId?: string | null;
  syncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
