import { z } from "zod";

export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    website: z.string().url().optional().or(z.literal("")),
    githubUrl: z.string().url().optional().or(z.literal("")),
    description: z.string().optional()
  })
});

export const updateOrganizationSchema = createOrganizationSchema.deepPartial();
