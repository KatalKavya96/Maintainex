import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { analyticsRoutes } from "./modules/analytics/analytics.routes";
import { activityRoutes } from "./modules/activity/activity.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { goalRoutes } from "./modules/goal/goal.routes";
import { organizationRoutes } from "./modules/organization/organization.routes";
import { pinRoutes } from "./modules/pin/pin.routes";
import { profileRoutes } from "./modules/profile/profile.routes";
import { repositoryRoutes } from "./modules/repository/repository.routes";
import { scheduledWorkRoutes } from "./modules/scheduledWork/scheduledWork.routes";
import { socialRoutes } from "./modules/social/social.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { ApiError } from "./utils/ApiError";

export const app = express();

const isAllowedOrigin = (origin?: string) => {
  if (!origin) return true;
  if (env.clientUrls.includes(origin)) return true;

  try {
    const url = new URL(origin);
    if (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)) return true;
    return env.allowVercelOrigins && url.protocol === "https:" && url.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new ApiError(403, `CORS blocked origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/repositories", repositoryRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/pins", pinRoutes);
app.use("/api/scheduled-work", scheduledWorkRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/social", socialRoutes);

app.use(errorMiddleware);
