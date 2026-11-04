import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    adminCode: z.string().optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(1, "Password is required.")
  })
});

const nonce = z.string().min(16, "Sign-in could not start. Refresh the page and try again.").max(200);

export const oauthUrlSchema = z.object({
  params: z.object({
    provider: z.enum(["google", "github"])
  }),
  query: z.object({
    nonce,
    origin: z.string().max(300).optional()
  })
});

export const oauthSessionSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(4000),
    nonce
  })
});
