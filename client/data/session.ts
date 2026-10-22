"use client";

const TOKEN_COOKIE = "maintainex.token";
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function getSessionToken() {
  if (typeof document === "undefined") return null;
  if (typeof document.cookie !== "string") return null;
  const match = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${TOKEN_COOKIE}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export function setSessionToken(token: string) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${TOKEN_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function clearSessionToken() {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
