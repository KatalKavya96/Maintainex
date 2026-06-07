import { z } from "zod";

const optionalUrl = z.string().url().or(z.literal("")).optional().nullable();
const stringArray = z.array(z.string().trim().min(1)).max(24).optional();

export const usernameAvailabilitySchema = z.object({
  query: z.object({
    username: z.string().min(3).max(39)
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(80).optional(),
    username: z.string().trim().min(3).max(39).optional(),
    bio: z.string().trim().max(500).or(z.literal("")).optional().nullable(),
    githubUrl: optionalUrl,
    linkedinUrl: optionalUrl,
    xUrl: optionalUrl,
    leetcodeUrl: optionalUrl,
    portfolioUrl: optionalUrl,
    skills: stringArray,
    mainOrganizations: stringArray
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128)
  })
});

export const resetWorkspaceSchema = z.object({
  body: z.object({
    password: z.string().min(1)
  })
});

export const verifyEmailOtpSchema = z.object({
  body: z.object({
    code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit verification code.")
  })
});
