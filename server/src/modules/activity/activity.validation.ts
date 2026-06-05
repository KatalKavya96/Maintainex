import { z } from "zod";

const activityType = z.enum(["PR_REVIEWED", "PR_RAISED", "ISSUE_RAISED", "PR_CLOSED", "ISSUE_CLOSED", "COMMENTED", "MERGED", "OTHER"]);
const status = z.enum(["OPEN", "CLOSED", "MERGED", "REVIEWED", "APPROVED", "CHANGES_REQUESTED", "COMMENTED", "DRAFT", "OTHER"]);
const reviewType = z.enum(["COMMENTED", "APPROVED", "CHANGES_REQUESTED", "REQUESTED_REVIEW", "NOT_APPLICABLE"]);
const closingReason = z.enum([
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
]);

export const createActivitySchema = z.object({
  body: z.object({
    date: z.string(),
    activityType,
    title: z.string().min(1),
    number: z.string().optional(),
    link: z.string().url().optional().or(z.literal("")),
    status: status.default("OTHER"),
    reviewType: reviewType.default("NOT_APPLICABLE"),
    closingReason: closingReason.default("NOT_APPLICABLE"),
    description: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
    organizationId: z.string().optional(),
    repositoryId: z.string().optional(),
    organizationName: z.string().min(1).optional(),
    repositoryName: z.string().min(1).optional(),
    organizationNameSnapshot: z.string().min(1).optional(),
    repositoryNameSnapshot: z.string().min(1).optional()
  }).refine((data) => data.organizationName || data.organizationNameSnapshot, {
    message: "Organization name is required",
    path: ["organizationName"]
  }).refine((data) => data.repositoryName || data.repositoryNameSnapshot, {
    message: "Repository name is required",
    path: ["repositoryName"]
  })
});

export const updateActivitySchema = createActivitySchema.deepPartial();
