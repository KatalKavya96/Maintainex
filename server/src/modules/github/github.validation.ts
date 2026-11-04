import { z } from "zod";

export const githubSyncSchema = z.object({
  body: z
    .object({
      since: z.string().datetime().optional(),
      maxPages: z.number().int().min(1).max(5).optional(),
      auto: z.boolean().optional()
    })
    .optional()
});

export const githubConnectUrlSchema = z.object({
  query: z.object({
    nonce: z.string().min(16).max(200),
    origin: z.string().max(300).optional()
  })
});

export const githubConnectSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(4000),
    nonce: z.string().min(16).max(200)
  })
});

export const githubPreferencesSchema = z.object({
  body: z
    .object({
      autoSync: z.boolean(),
      importPullRequests: z.boolean(),
      importReviews: z.boolean(),
      importIssues: z.boolean(),
      importComments: z.boolean(),
      importAssignedIssues: z.boolean(),
      importRepositories: z.boolean()
    })
    .partial()
    .strict()
    .refine((value) => Object.keys(value).length > 0, "Choose at least one setting to change.")
});

export const githubDisconnectSchema = z.object({
  query: z.object({ removeImported: z.enum(["true", "false"]).optional() })
});
