"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Activity } from "@/types/activity";
import { apiRequest } from "@/lib/api";
import { authChangedEvent, useAuthStore } from "@/lib/authStore";

export const realtimeDashboardEvent = "maintainex-realtime-dashboard";

type ActivityInput = Omit<Activity, "id" | "createdAt" | "updatedAt">;
type ApiActivity = Omit<Activity, "date" | "organizationName" | "repositoryName" | "tags" | "number" | "link" | "description" | "notes"> & {
  date: string;
  organizationNameSnapshot: string;
  repositoryNameSnapshot: string;
  number?: string | null;
  link?: string | null;
  description?: string | null;
  notes?: string | null;
  tags?: unknown;
};

interface ActivityStore {
  activities: Activity[];
  addActivity: (activity: ActivityInput) => Promise<Activity>;
  updateActivity: (id: string, activity: ActivityInput) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  resetAll: () => Promise<void>;
}

const ActivityContext = createContext<ActivityStore | undefined>(undefined);

const mapApiActivity = (activity: ApiActivity): Activity => ({
  ...activity,
  date: activity.date.slice(0, 10),
  organizationName: activity.organizationNameSnapshot,
  repositoryName: activity.repositoryNameSnapshot,
  number: activity.number ?? "",
  link: activity.link ?? "",
  description: activity.description ?? "",
  notes: activity.notes ?? "",
  tags: Array.isArray(activity.tags) ? activity.tags.filter((tag): tag is string => typeof tag === "string") : []
});

const toApiPayload = (activity: ActivityInput) => ({
  date: activity.date,
  activityType: activity.activityType,
  title: activity.title,
  number: activity.number,
  link: activity.link,
  status: activity.status,
  reviewType: activity.reviewType,
  closingReason: activity.closingReason,
  description: activity.description,
  notes: activity.notes,
  tags: activity.tags,
  organizationName: activity.organizationName,
  repositoryName: activity.repositoryName
});

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const { isReady, token, user } = useAuthStore();

  const loadActivities = useCallback(() => {
    if (!isReady) return;
    if (!token || !user?.id) {
      setActivities([]);
      return;
    }

    apiRequest<{ items: ApiActivity[] }>("/activities?limit=1000")
      .then((data) => {
        setActivities(data.items.map(mapApiActivity));
      })
      .catch((error) => {
        console.error("Failed to load activities", error);
        setActivities([]);
      });
  }, [isReady, token, user?.id]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  useEffect(() => {
    window.addEventListener(authChangedEvent, loadActivities);
    window.addEventListener(realtimeDashboardEvent, loadActivities);
    return () => {
      window.removeEventListener(authChangedEvent, loadActivities);
      window.removeEventListener(realtimeDashboardEvent, loadActivities);
    };
  }, [loadActivities]);

  const store = useMemo<ActivityStore>(
    () => ({
      activities,
      addActivity: async (activity) => {
        const created = await apiRequest<ApiActivity>("/activities", {
          method: "POST",
          body: JSON.stringify(toApiPayload(activity))
        });
        const mapped = mapApiActivity(created);
        setActivities((current) => [mapped, ...current]);
        return mapped;
      },
      updateActivity: async (id, activity) => {
        const updated = await apiRequest<ApiActivity>(`/activities/${id}`, {
          method: "PUT",
          body: JSON.stringify(toApiPayload(activity))
        });
        const mapped = mapApiActivity(updated);
        setActivities((current) => current.map((item) => (item.id === id ? mapped : item)));
      },
      deleteActivity: async (id) => {
        await apiRequest<null>(`/activities/${id}`, { method: "DELETE" });
        setActivities((current) => current.filter((item) => item.id !== id));
      },
      resetAll: async () => {
        await apiRequest<null>("/activities", { method: "DELETE" });
        setActivities([]);
      }
    }),
    [activities]
  );

  return <ActivityContext.Provider value={store}>{children}</ActivityContext.Provider>;
}

export function useActivityStore() {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error("useActivityStore must be used inside ActivityProvider");
  }
  return context;
}
