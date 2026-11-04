/** Returns a clickable href only for http(s) links; stored values written before server validation may be anything. */
export function webHref(value?: string | null) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}
