import { z } from "zod";

const message = "Use a full http:// or https:// link.";

/** Only web links: stored URLs are rendered as clickable anchors for the owner and, on profiles, for other people. */
export function isWebUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export const webUrl = z.string().trim().max(2048, "Links can be at most 2048 characters.").refine(isWebUrl, message);
export const optionalWebUrl = webUrl.optional().or(z.literal(""));
export const nullableWebUrl = webUrl.or(z.literal("")).optional().nullable();

/** Accepts "github.com/owner/repo" by assuming https; anything with another scheme is rejected. */
export const lenientWebUrl = z
  .string()
  .trim()
  .min(1, "URL is required")
  .max(2048, "Links can be at most 2048 characters.")
  .transform((value) => (/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`))
  .refine(isWebUrl, message);
