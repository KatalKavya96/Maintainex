import { z } from "zod";

const category = z.enum(["REPOSITORY", "ISSUE", "PULL_REQUEST", "DOCUMENTATION", "PROJECT_BOARD", "ORGANIZATION", "WEBSITE", "OTHER"]);
const optionalUrl = z.string().trim().url().optional().or(z.literal(""));

export const createPinSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, "Title is required"),
    url: z.string().trim().min(1, "URL is required"),
    description: z.string().optional(),
    category,
    customCategory: z.string().optional(),
    iconUrl: optionalUrl,
    faviconUrl: optionalUrl,
    imageUrl: optionalUrl,
    isFavorite: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    sortOrder: z.number().int().optional()
  })
});

export const updatePinSchema = createPinSchema.deepPartial();

export const favoritePinSchema = z.object({
  body: z.object({
    isFavorite: z.boolean().optional()
  })
});

export const reorderPinsSchema = z.object({
  body: z.object({
    items: z.array(z.object({ id: z.string().min(1), sortOrder: z.number().int() })).min(1)
  })
});
