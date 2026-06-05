import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { analyticsRoutes } from "./modules/analytics/analytics.routes";
import { activityRoutes } from "./modules/activity/activity.routes";
import { organizationRoutes } from "./modules/organization/organization.routes";
import { repositoryRoutes } from "./modules/repository/repository.routes";
import { errorMiddleware } from "./middlewares/error.middleware";

export const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.clientUrls.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/activities", activityRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/repositories", repositoryRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use(errorMiddleware);
