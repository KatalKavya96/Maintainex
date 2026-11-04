import { z } from "zod";
import { optionalWebUrl } from "../../utils/webUrl";

export const createRepositorySchema = z.object({
  body: z.object({
    organizationId: z.string().min(1),
    name: z.string().min(1),
    githubUrl: optionalWebUrl,
    description: z.string().optional(),
    primaryTechStack: z.string().optional(),
    isActive: z.boolean().optional()
  })
});

export const updateRepositorySchema = createRepositorySchema.deepPartial();
