export type ScheduledWorkType = "PR_REVIEW" | "ISSUE_WORK" | "PR_TO_RAISE" | "ISSUE_TO_RAISE" | "BUG_FIX" | "FEATURE_BUILD" | "DOCUMENTATION" | "TESTING" | "OTHER";
export type ScheduledWorkStatus = "PLANNED" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "CANCELLED" | "POSTPONED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type WorkDifficulty = "EASY" | "MEDIUM" | "HARD";

export type ScheduledWork = {
  id: string;
  userId: string;
  title: string;
  type: ScheduledWorkType;
  status: ScheduledWorkStatus;
  priority: Priority;
  organizationName: string;
  repositoryName: string;
  itemNumber?: number | null;
  itemUrl?: string | null;
  assignedToMe: boolean;
  assignedSince?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  labels: string[];
  tags: string[];
  difficulty?: WorkDifficulty | null;
  context?: string | null;
  plan?: string | null;
  blockers?: string | null;
  closingNotes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ScheduledWorkInput = Omit<ScheduledWork, "id" | "userId" | "createdAt" | "updatedAt" | "labels" | "tags"> & {
  labels: string[];
  tags: string[];
};

export type ScheduledWorkListResponse = {
  items: ScheduledWork[];
  total: number;
  page: number;
  limit: number;
};
