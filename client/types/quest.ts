import type { ScheduledWorkStatus } from "./scheduledWork";

export type QuestProgressStatus = "STARTED" | "SUBMITTED" | "COMPLETED";
export interface Quest {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  points: number;
  isActive: boolean;
  isArchived: boolean;
  sourceUrl: string | null;
  resourceUrl: string | null;
  acceptanceCriteria: string | null;
  updatedAt: string;
  isSaved: boolean;
  canManage: boolean;
  organization: { id: string; name: string; slug: string | null; githubUrl: string | null };
  repository: { id: string; name: string; fullName: string | null; githubUrl: string | null; isActive: boolean } | null;
  progress: {
    status: QuestProgressStatus;
    completedAt: string | null;
    evidenceUrl: string | null;
    completionNote: string | null;
    work: { id: string; status: ScheduledWorkStatus; plan: string | null; blockers: string | null; closingNotes: string | null } | null;
  } | null;
}
export interface QuestListResponse {
  items: Quest[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
export type QuestAuthoringOptions = Array<{ id: string; name: string; repositories: Array<{ id: string; name: string }> }>;
export type CreateQuestInput = { organizationId: string; repositoryId?: string | null; title: string; description: string; acceptanceCriteria: string; sourceUrl: string; type: string; difficulty: string };
