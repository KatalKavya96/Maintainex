"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Activity } from "@/types/activity";
import { mapApiActivity, type ApiActivity } from "@/data/api/activities";
import { apiRequest } from "@/data/http";
import { authChangedEvent, useAuthStore } from "@/state/auth";

export const realtimeDashboardEvent = "maintainex-realtime-dashboard";

type ActivityInput = Omit<Activity, "id" | "createdAt" | "updatedAt">;
interface ActivityStore {
  activities: Activity[];
  loading: boolean;
  error: string;
  total: number;
  reload: () => void;
  addActivity: (activity: ActivityInput) => Promise<Activity>;
  updateActivity: (id: string, activity: ActivityInput) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  resetAll: () => Promise<void>;
}

const ActivityContext = createContext<ActivityStore | undefined>(undefined);

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const request = useRef(0);
  const { isReady, token, user } = useAuthStore();

  const loadActivities = useCallback(() => {
    const version = ++request.current;
    if (!isReady) return;
    if (!token || !user?.id) {
      setActivities([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    apiRequest<{ items: ApiActivity[]; total: number }>("/activities?limit=1000")
      .then((data) => {
        if (version !== request.current) return;
        setActivities(data.items.map(mapApiActivity));
        setTotal(data.total);
      })
      .catch((error) => {
        if (version === request.current) setError(error instanceof Error ? error.message : "Unable to load activities.");
      }).finally(() => { if (version === request.current) setLoading(false); });
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
      activities, loading, error, total, reload: loadActivities,
      addActivity: async (activity) => {
        const created = await apiRequest<ApiActivity>("/activities", {
          method: "POST",
          body: JSON.stringify(toApiPayload(activity))
        });
        const mapped = mapApiActivity(created);
        setActivities((current) => [mapped, ...current]);
        setTotal(current => current + 1);
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
        setTotal(current => Math.max(0, current - 1));
      },
      resetAll: async () => {
        await apiRequest<null>("/activities", { method: "DELETE" });
        setActivities([]);
        setTotal(0);
      }
    }),
    [activities, loading, error, total, loadActivities]
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
