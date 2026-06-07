import { z } from "zod";

export const githubSyncSchema = z.object({
  body: z.object({
    since: z.string().datetime().optional(),
    maxPages: z.number().int().min(1).max(5).optional()
  }).optional()
});

export const githubCallbackSchema = z.object({
  query: z.object({
    code: z.string().min(1),
    state: z.string().min(1)
  })
});
