import type { GitHubClient } from "./github.api";
import { activityStatusFromReview, isMerged, reviewTypeFromState, toDate, type ActivityOverrides } from "./github.records";
import type { GitHubReview, GitHubSearchItem } from "./github.types";

const sameLogin = (a: string | undefined, b: string) => Boolean(a) && a!.toLowerCase() === b.toLowerCase();
const decisive = (state: string) => state === "APPROVED" || state === "CHANGES_REQUESTED";

/**
 * The reviewer's standing verdict, as GitHub shows it on the PR: the latest APPROVED or
 * CHANGES_REQUESTED review wins, and later plain comments do not replace it. Dismissed
 * verdicts no longer count. Without a verdict, the latest submitted review is a comment.
 */
export function standingReview(reviews: GitHubReview[], login: string): GitHubReview | null {
  const mine = reviews.filter((review) => sameLogin(review.user?.login, login) && review.state && review.state !== "PENDING");
  const verdict = mine.filter((review) => decisive(review.state!)).at(-1);
  return verdict ?? mine.at(-1) ?? null;
}

export function reviewOverrides(review: GitHubReview | null): ActivityOverrides {
  if (!review) return {};
  const state = decisive(review.state!) ? review.state!.toLowerCase() : "commented";
  return {
    reviewType: reviewTypeFromState(state),
    status: activityStatusFromReview(state),
    date: toDate(review.submitted_at),
    ...(review.html_url ? { link: review.html_url } : {}),
    ...(review.body ? { notes: review.body } : {})
  };
}

/** Maintainer-side details the search API leaves out: the real review verdict and who pressed merge. */
export class MaintainerDetails {
  constructor(private client: Pick<GitHubClient, "pullReviews" | "pullRequest">, private login: string) {}

  async reviewOf(item: GitHubSearchItem) {
    return reviewOverrides(standingReview(await this.client.pullReviews(item), this.login));
  }

  /** Only PRs the user did not author reach here, so a match means they merged someone else's work. */
  async mergedByMe(item: GitHubSearchItem): Promise<ActivityOverrides | null> {
    if (!isMerged(item)) return null;
    const pull = await this.client.pullRequest(item);
    if (!pull?.merged_at || !sameLogin(pull.merged_by?.login, this.login)) return null;
    return { date: toDate(pull.merged_at), notes: "You merged this pull request as a maintainer." };
  }
}
