import { z } from "zod";

const type = z.enum(["PR_REVIEW", "ISSUE_WORK", "PR_TO_RAISE", "ISSUE_TO_RAISE", "BUG_FIX", "FEATURE_BUILD", "DOCUMENTATION", "TESTING", "OTHER"]);
const status = z.enum(["PLANNED", "IN_PROGRESS", "BLOCKED", "DONE", "CANCELLED", "POSTPONED"]);
const priority = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
const difficulty = z.enum(["EASY", "MEDIUM", "HARD"]);
const optionalDate = z.string().optional().or(z.literal(""));
const optionalUrl = z.string().trim().url().optional().or(z.literal(""));

export const createScheduledWorkSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1),
    type,
    status: status.default("PLANNED"),
    priority: priority.default("MEDIUM"),
    organizationName: z.string().trim().min(1),
    repositoryName: z.string().trim().min(1),
    itemNumber: z.number().int().positive().optional(),
    itemUrl: optionalUrl,
    assignedToMe: z.boolean().optional(),
    assignedSince: optionalDate,
    startDate: optionalDate,
    dueDate: optionalDate,
    completedAt: optionalDate,
    estimatedHours: z.number().nonnegative().optional(),
    actualHours: z.number().nonnegative().optional(),
    labels: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    difficulty: difficulty.optional(),
    context: z.string().optional(),
    plan: z.string().optional(),
    blockers: z.string().optional(),
    closingNotes: z.string().optional()
  })
});

export const updateScheduledWorkSchema = createScheduledWorkSchema.deepPartial();

export const updateScheduledWorkStatusSchema = z.object({
  body: z.object({
    status
  })
});
