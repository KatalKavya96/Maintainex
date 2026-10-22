import { z } from "zod";

export const safeWebUrl = z.string().trim().max(2048).url().refine((value) => {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}, "Use an http or https link without credentials.");

export const questQuery = z.object({
  search: z.string().trim().max(120).default(""),
  difficulty: z.enum(["", "EASY", "MEDIUM", "HARD"]).default(""),
  status: z.enum(["all", "available", "started", "completed", "saved", "archived"]).default("all"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(12)
});

export const createQuest = z.object({
  organizationId: z.string().min(1).max(200),
  repositoryId: z.string().min(1).max(200).nullable().optional(),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(20000),
  acceptanceCriteria: z.string().trim().min(5).max(10000),
  sourceUrl: safeWebUrl,
  type: z.enum(["BUG_FIX", "DOCUMENTATION", "TESTING", "FEATURE_BUILD", "ISSUE_WORK"]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"])
});

export const questProgress = z.object({
  status: z.enum(["STARTED", "SUBMITTED", "COMPLETED"]),
  evidenceUrl: z.union([safeWebUrl, z.literal("")]).optional(),
  completionNote: z.string().trim().max(10000).optional()
}).superRefine((value, ctx) => {
  if (value.status === "SUBMITTED" && !value.evidenceUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["evidenceUrl"], message: "Add a link to the contribution you submitted." });
  }
});
