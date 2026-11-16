import crypto from "crypto";
import type { ActivityType, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { emitDashboardUpdate } from "../../realtime/socket";
import { ApiError } from "../../utils/ApiError";
import { activityStatusFromReview, GitHubRecords, reviewTypeFromState, toDate, type ActivityOverrides } from "./github.records";
import type { GitHubRepo, GitHubSearchItem, GitHubWebhookPayload } from "./github.types";

const header = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Signed, idempotent GitHub webhook deliveries for repositories that install one. */
export class GitHubWebhooks {
  constructor(private db: PrismaClient = prisma, private records = new GitHubRecords(db)) {}

  async handle(headers: Record<string, string | string[] | undefined>, rawBody: Buffer | undefined, payload: GitHubWebhookPayload) {
    if (!env.githubWebhookSecret) throw new ApiError(503, "GitHub webhook secret is not configured");
    if (!rawBody) throw new ApiError(400, "Missing raw webhook body");
    this.verifySignature(header(headers["x-hub-signature-256"]), rawBody);

    const deliveryId = header(headers["x-github-delivery"]);
    const event = header(headers["x-github-event"]) ?? "unknown";
    if (!deliveryId) throw new ApiError(400, "Missing GitHub delivery id");

    const existing = await this.db.gitHubWebhookDelivery.findUnique({ where: { deliveryId } });
    if (existing?.status === "PROCESSED" || existing?.status === "SKIPPED") return { status: "duplicate", deliveryId };

    const delivery = await this.db.gitHubWebhookDelivery.upsert({
      where: { deliveryId },
      update: { event, action: payload.action, status: "RECEIVED", payload: payload as Prisma.InputJsonObject },
      create: { deliveryId, event, action: payload.action, payload: payload as Prisma.InputJsonObject }
    });
    try {
      const result = await this.process(event, payload);
      await this.db.gitHubWebhookDelivery.update({ where: { id: delivery.id }, data: { status: result.processed ? "PROCESSED" : "SKIPPED", processedAt: new Date(), error: result.reason ?? null } });
      return { deliveryId, ...result };
    } catch (error) {
      await this.db.gitHubWebhookDelivery.update({ where: { id: delivery.id }, data: { status: "FAILED", processedAt: new Date(), error: error instanceof Error ? error.message : "Webhook processing failed" } });
      throw error;
    }
  }

  private async process(event: string, payload: GitHubWebhookPayload): Promise<{ processed: boolean; reason?: string; affectedUserId?: string }> {
    const { action, repository: repo } = payload;
    if (!repo) return { processed: false, reason: "Missing repository payload" };
    const pr = payload.pull_request;

    if (event === "pull_request" && pr) {
      if (action === "opened" || action === "reopened") return this.activity(pr.user?.id, repo, pr, "PR_RAISED", `github:prRaised:${pr.node_id}`, "importPullRequests");
      if (action === "closed") {
        const result = await this.activity(pr.user?.id, repo, pr, "PR_RAISED", `github:prRaised:${pr.node_id}`, "importPullRequests");
        if (pr.merged) await this.activity(pr.user?.id, repo, pr, "MERGED", `github:mergedPrs:${pr.node_id}`, "importPullRequests");
        if (pr.merged && pr.merged_by?.id && pr.merged_by.id !== pr.user?.id) {
          await this.activity(pr.merged_by.id, repo, pr, "MERGED", `github:mergedByMe:${pr.node_id}`, "importPullRequests", {
            date: toDate(pr.merged_at), notes: "You merged this pull request as a maintainer."
          });
        }
        return result;
      }
    }
    if (event === "pull_request_review" && pr && payload.review) {
      const review = payload.review;
      return this.activity(review.user?.id, repo, pr, "PR_REVIEWED", `github:prReviewed:${pr.node_id}`, "importReviews", {
        reviewType: reviewTypeFromState(review.state), status: activityStatusFromReview(review.state), date: toDate(review.submitted_at), link: review.html_url, notes: review.body ?? undefined
      });
    }
    if (event === "issues" && payload.issue) {
      const issue = payload.issue;
      if (action === "opened" || action === "closed" || action === "reopened") return this.activity(issue.user?.id, repo, issue, "ISSUE_RAISED", `github:issuesRaised:${issue.node_id}`, "importIssues");
      if ((action === "assigned" || action === "unassigned") && payload.assignee) {
        const integration = await this.integration(payload.assignee.id, "importAssignedIssues");
        if (!integration) return { processed: false, reason: "Assignee is not connected or has assigned-issue import off" };
        if (action === "assigned") await this.records.upsertAssignedIssue(integration.userId, repo, issue);
        emitDashboardUpdate(integration.userId);
        return { processed: true, affectedUserId: integration.userId };
      }
    }
    if (event === "issue_comment" && action === "created" && payload.issue && payload.comment) {
      return this.activity(payload.comment.user?.id, repo, payload.issue, "COMMENTED", `github:comments:${payload.issue.node_id}`, "importComments", { date: toDate(payload.comment.created_at), link: payload.comment.html_url });
    }
    return { processed: false, reason: `Ignored event ${event}:${action ?? "unknown"}` };
  }

  private integration(githubUserId: number, preference: "importPullRequests" | "importReviews" | "importIssues" | "importComments" | "importAssignedIssues") {
    return this.db.gitHubIntegration.findFirst({ where: { githubUserId: String(githubUserId), needsReconnect: false, [preference]: true } });
  }

  private async activity(githubUserId: number | undefined, repo: GitHubRepo, item: GitHubSearchItem, type: ActivityType, externalId: string, preference: Parameters<GitHubWebhooks["integration"]>[1], overrides: ActivityOverrides = {}) {
    if (!githubUserId) return { processed: false, reason: "Missing GitHub user id" };
    const integration = await this.integration(githubUserId, preference);
    if (!integration) return { processed: false, reason: "Actor is not connected or has this import off" };
    await this.records.upsertActivity(integration.userId, repo, item, type, externalId, overrides);
    emitDashboardUpdate(integration.userId);
    return { processed: true, affectedUserId: integration.userId };
  }

  private verifySignature(actual: string | undefined, rawBody: Buffer) {
    if (!actual) throw new ApiError(401, "Missing GitHub signature");
    const expected = Buffer.from(`sha256=${crypto.createHmac("sha256", env.githubWebhookSecret!).update(rawBody).digest("hex")}`);
    const received = Buffer.from(actual);
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) throw new ApiError(401, "Invalid GitHub signature");
  }
}
