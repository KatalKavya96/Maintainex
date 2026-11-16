export type GitHubPreferences = {
  autoSync: boolean;
  importPullRequests: boolean;
  importReviews: boolean;
  importIssues: boolean;
  importComments: boolean;
  importAssignedIssues: boolean;
  importRepositories: boolean;
};

export type GitHubStatus = {
  connected: boolean;
  configAvailable: boolean;
  login: string | null;
  scopes: string;
  lastSyncedAt: string | null;
  syncing: boolean;
  lastSyncError: string | null;
  needsReconnect: boolean;
  preferences: GitHubPreferences | null;
  webhookConfigured: boolean;
};

export type GitHubSyncResult = {
  status: "completed" | "skipped";
  reason?: string;
  repositories: number;
  prRaised: number;
  prReviewed: number;
  issuesRaised: number;
  mergedPrs: number;
  mergedByMe: number;
  comments: number;
  assignedIssues: number;
  created: number;
  updated: number;
  keptDeleted: number;
  failed: number;
  truncated: boolean;
};
