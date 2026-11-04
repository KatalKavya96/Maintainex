import type { Request } from "express";
import { env } from "./env";

export function isAllowedOrigin(origin?: string) {
  if (!origin) return true;
  if (env.clientUrls.includes(origin)) return true;

  try {
    const url = new URL(origin);
    if (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)) return true;
    return env.allowVercelOrigins && url.protocol === "https:" && url.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

/** Where the browser lands after an OAuth round trip: configured app URLs or local development only, never a wildcard host. */
export function clientOriginFor(requested: unknown) {
  if (typeof requested !== "string" || !requested) return env.clientAppUrl;
  try {
    const url = new URL(requested);
    const local = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
    return local || env.clientUrls.includes(url.origin) ? url.origin : env.clientAppUrl;
  } catch {
    return env.clientAppUrl;
  }
}

/** Public base URL of this API as the browser reaches it (Vercel serves it on the app's own host). */
export function apiBaseFor(req: Request) {
  const host = req.get("x-forwarded-host") ?? req.get("host");
  const proto = (req.get("x-forwarded-proto") ?? req.protocol).split(",")[0].trim();
  return host ? `${proto}://${host}` : `http://localhost:${env.port}`;
}
