import dotenv from "dotenv";

dotenv.config();

const splitOrigins = (value?: string) =>
  value
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
const allowVercelOrigins = process.env.ALLOW_VERCEL_ORIGINS !== "false";
const clientAppUrl = (process.env.CLIENT_URL ?? vercelUrl ?? "http://localhost:3000").replace(/\/$/, "");
const clientUrls = Array.from(
  new Set([
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.CLIENT_URL,
    vercelUrl,
    ...splitOrigins(process.env.CLIENT_URLS),
    ...splitOrigins(process.env.CORS_ORIGINS)
  ].filter((origin): origin is string => Boolean(origin)))
);

export const env = {
  port: Number(process.env.PORT ?? 5001),
  clientUrls,
  clientAppUrl,
  allowVercelOrigins,
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-maintainex-secret-change-me",
  signupAdminCode: process.env.SIGNUP_ADMIN_CODE,
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  githubRedirectUri: process.env.GITHUB_REDIRECT_URI,
  githubAuthRedirectUri: process.env.GITHUB_AUTH_REDIRECT_URI,
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
  githubTokenEncryptionKey: process.env.GITHUB_TOKEN_ENCRYPTION_KEY,
  githubApiVersion: process.env.GITHUB_API_VERSION ?? "2026-03-10",
  githubOAuthScopes: process.env.GITHUB_OAUTH_SCOPES ?? "read:user user:email public_repo",
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
  resendApiKey: process.env.RESEND_API_KEY,
  mailFrom: process.env.MAIL_FROM ?? "Maintainex <noreply@maintainex.app>",
  emailDnsCheck: process.env.EMAIL_DNS_CHECK !== "false"
};
