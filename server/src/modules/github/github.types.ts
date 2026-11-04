export type GitHubUser = {
  id: number;
  login: string;
  name?: string | null;
  html_url?: string;
  avatar_url?: string;
};

export type GitHubRepo = {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  html_url: string;
  description?: string | null;
  language?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  watchers_count?: number;
  open_issues_count?: number;
  license?: { key?: string; name?: string; spdx_id?: string } | null;
  owner: GitHubUser & { node_id?: string };
  updated_at?: string;
};

export type GitHubSearchItem = {
  id: number;
  node_id: string;
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  merged_at?: string | null;
  body?: string | null;
  user?: GitHubUser | null;
  assignee?: GitHubUser | null;
  assignees?: GitHubUser[];
  labels?: { name: string }[];
  repository_url: string;
  pull_request?: { html_url: string; merged_at?: string | null };
  draft?: boolean;
};

export type GitHubWebhookPayload = Record<string, unknown> & {
  action?: string;
  sender?: GitHubUser;
  repository?: GitHubRepo;
  pull_request?: GitHubSearchItem & { merged?: boolean; draft?: boolean; user?: GitHubUser | null };
  review?: { id: number; node_id?: string; user?: GitHubUser | null; state?: string; submitted_at?: string; body?: string | null; html_url?: string };
  issue?: GitHubSearchItem;
  comment?: { id: number; node_id?: string; user?: GitHubUser | null; body?: string | null; html_url?: string; created_at?: string };
  assignee?: GitHubUser;
};

export type SyncPreferences = {
  autoSync: boolean;
  importPullRequests: boolean;
  importReviews: boolean;
  importIssues: boolean;
  importComments: boolean;
  importAssignedIssues: boolean;
  importRepositories: boolean;
};

export const preferenceKeys = ["autoSync", "importPullRequests", "importReviews", "importIssues", "importComments", "importAssignedIssues", "importRepositories"] as const;
