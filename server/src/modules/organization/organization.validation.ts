import { z } from "zod";
import { optionalWebUrl } from "../../utils/webUrl";

export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    website: optionalWebUrl,
    githubUrl: optionalWebUrl,
    description: z.string().optional()
  })
});

export const updateOrganizationSchema = createOrganizationSchema.deepPartial();
