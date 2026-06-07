import { z } from "zod";

export const coachSchema = z.object({
  body: z.object({
    question: z.string().trim().min(3, "Question is required").max(500)
  })
});

export const contextSchema = z.object({
  body: z.object({
    url: z.string().trim().url("A valid PR or issue URL is required")
  })
});

export const reviewNotesSchema = z.object({
  body: z.object({
    notes: z.string().trim().min(3, "Notes are required").max(3000)
  })
});
