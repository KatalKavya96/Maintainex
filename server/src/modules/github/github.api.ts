import { env } from "../../config/env";
import type { GitHubPullRequest, GitHubRepo, GitHubReview, GitHubSearchItem } from "./github.types";

export class GitHubAuthError extends Error {}
export class GitHubRateLimitError extends Error {
  constructor(public resetAt: Date | null) {
    super("GitHub rate limit reached");
  }
}

export type FetchLike = (input: string, init?: { headers?: Record<string, string> }) => Promise<Response>;

const SEARCH_PAGE = 50;

const repoPath = (item: Pick<GitHubSearchItem, "repository_url">) => {
  const match = /\/repos\/([^/]+)\/([^/?#]+)/.exec(item.repository_url ?? "");
  return match ? `${match[1]}/${match[2]}` : null;
};

/** One sync's view of GitHub: typed requests, rate-limit awareness and a per-sync repository cache. */
export class GitHubClient {
  private repos = new Map<string, Promise<GitHubRepo | null>>();
  truncated = false;

  constructor(private token: string, private fetchImpl: FetchLike = (input, init) => fetch(input, init)) {}

  async request<T>(path: string): Promise<T> {
    const response = await this.fetchImpl(path.startsWith("https://") ? path : `https://api.github.com${path}`, {
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${this.token}`, "X-GitHub-Api-Version": env.githubApiVersion, "User-Agent": "Maintainex" }
    });
    if (response.status === 401) throw new GitHubAuthError("GitHub access was revoked or expired.");
    const remaining = response.headers.get("x-ratelimit-remaining");
    if ((response.status === 403 || response.status === 429) && (remaining === "0" || response.headers.get("retry-after"))) {
      const reset = Number(response.headers.get("x-ratelimit-reset"));
      throw new GitHubRateLimitError(Number.isFinite(reset) && reset > 0 ? new Date(reset * 1000) : null);
    }
    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as { message?: string };
      throw new Error(`GitHub ${response.status}: ${error.message ?? "request failed"}`);
    }
    return response.json() as Promise<T>;
  }

  async userRepos(maxPages: number) {
    const repos: GitHubRepo[] = [];
    for (let page = 1; page <= maxPages; page += 1) {
      const batch = await this.request<GitHubRepo[]>(`/user/repos?affiliation=owner,collaborator,organization_member&sort=updated&per_page=100&page=${page}`);
      repos.push(...batch);
      if (batch.length < 100) return repos;
    }
    this.truncated = true;
    return repos;
  }

  async searchIssues(query: string, maxPages: number) {
    const items: GitHubSearchItem[] = [];
    for (let page = 1; page <= maxPages; page += 1) {
      const response = await this.request<{ items: GitHubSearchItem[]; total_count?: number }>(
        `/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=${SEARCH_PAGE}&page=${page}`
      );
      items.push(...response.items);
      if (response.items.length < SEARCH_PAGE) return items;
    }
    this.truncated = true;
    return items;
  }

  /** Search results carry `repository_url` (…/repos/owner/name), not a numeric id. */
  repoFor(item: Pick<GitHubSearchItem, "repository_url">) {
    const path = repoPath(item);
    if (!path) return Promise.resolve(null);
    const key = path.toLowerCase();
    if (!this.repos.has(key)) {
      this.repos.set(key, this.request<GitHubRepo>(`/repos/${path}`).catch((error) => {
        if (error instanceof GitHubAuthError || error instanceof GitHubRateLimitError) throw error;
        return null;
      }));
    }
    return this.repos.get(key)!;
  }

  /** Every submitted review on a PR, oldest first. */
  pullReviews(item: Pick<GitHubSearchItem, "repository_url" | "number">) {
    const path = repoPath(item);
    return path ? this.request<GitHubReview[]>(`/repos/${path}/pulls/${item.number}/reviews?per_page=100`) : Promise.resolve([]);
  }

  /** The full PR, which (unlike search results) says who merged it. */
  pullRequest(item: Pick<GitHubSearchItem, "repository_url" | "number">) {
    const path = repoPath(item);
    return path ? this.request<GitHubPullRequest>(`/repos/${path}/pulls/${item.number}`) : Promise.resolve(null);
  }

  remember(repo: GitHubRepo) {
    this.repos.set(repo.full_name.toLowerCase(), Promise.resolve(repo));
  }
}
