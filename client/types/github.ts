export type GitHubStatus = {
  connected: boolean;
  configAvailable: boolean;
  webhookConfigured: boolean;
  login: string | null;
  scope: string | null;
  lastSyncedAt: string | null;
  syncCursor: string | null;
  redirectUri: string;
  scopes: string;
  missingConfig: string[];
  tokenEncryptionConfigured: boolean;
};

export type GitHubSyncResult = {
  repositories: number;
  prRaised: number;
  prReviewed: number;
  issuesRaised: number;
  mergedPrs: number;
  comments: number;
  assignedIssues: number;
  staleScheduledTasks: number;
};
