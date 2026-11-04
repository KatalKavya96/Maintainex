"use client";

export type OAuthFlow = "login" | "github-connect";
type Pending = { nonce: string; returnTo?: string };

const key = (flow: OAuthFlow) => `maintainex.oauth.${flow}`;

/** The nonce stays in this tab; the API only ever sees it again when this same tab finishes the flow. */
export function beginOAuthFlow(flow: OAuthFlow, returnTo?: string) {
  const nonce = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
  try {
    sessionStorage.setItem(key(flow), JSON.stringify({ nonce, returnTo } satisfies Pending));
  } catch {
    throw new Error("Your browser blocked session storage, which sign-in needs. Allow site data and try again.");
  }
  return nonce;
}

export function takeOAuthFlow(flow: OAuthFlow): Pending | null {
  try {
    const raw = sessionStorage.getItem(key(flow));
    sessionStorage.removeItem(key(flow));
    const value = raw ? (JSON.parse(raw) as Pending) : null;
    return value && typeof value.nonce === "string" ? value : null;
  } catch {
    return null;
  }
}
