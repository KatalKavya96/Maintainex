import dotenv from "dotenv";

dotenv.config();

const splitOrigins = (value?: string) =>
  value
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
const allowVercelOrigins = process.env.ALLOW_VERCEL_ORIGINS !== "false";
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
  allowVercelOrigins,
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-maintainex-secret-change-me",
  signupAdminCode: process.env.SIGNUP_ADMIN_CODE
};
