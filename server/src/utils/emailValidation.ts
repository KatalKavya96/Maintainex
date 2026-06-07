import dns from "dns/promises";
import { ApiError } from "./ApiError";
import { env } from "../config/env";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const blockedDomains = new Set(["example.com", "example.org", "example.net", "test.com", "invalid.com"]);

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function ensureUsableEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!emailPattern.test(normalized) || normalized.length > 254) {
    throw new ApiError(400, "Enter a valid email address.");
  }

  const domain = normalized.split("@")[1];
  if (!domain || blockedDomains.has(domain)) {
    throw new ApiError(400, "Enter a real email address that can receive mail.");
  }

  if (!env.emailDnsCheck) return normalized;

  try {
    const mx = await dns.resolveMx(domain);
    if (mx.length > 0) return normalized;
  } catch {
    // Fall through to A/AAAA lookup. Some small domains receive mail at the root.
  }

  try {
    const [aRecords, aaaaRecords] = await Promise.allSettled([dns.resolve4(domain), dns.resolve6(domain)]);
    const hasAddress =
      (aRecords.status === "fulfilled" && aRecords.value.length > 0) ||
      (aaaaRecords.status === "fulfilled" && aaaaRecords.value.length > 0);
    if (hasAddress) return normalized;
  } catch {
    // The explicit error below gives users a clean reason.
  }

  throw new ApiError(400, "Enter a valid email address. That email domain cannot receive mail.");
}

export function passwordStrength(password: string) {
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
    password.length >= 12
  ];
  const score = checks.filter(Boolean).length;
  const label = score <= 2 ? "weak" : score <= 4 ? "good" : "strong";
  return { score, label };
}

export function ensureStrongPassword(password: string) {
  const strength = passwordStrength(password);
  if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters.");
  if (strength.score < 3) {
    throw new ApiError(400, "Choose a stronger password with uppercase, lowercase, number, or symbol characters.");
  }
}
