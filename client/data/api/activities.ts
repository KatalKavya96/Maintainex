import { apiRequest } from "../http";
import type { Activity } from "@/types/activity";

export type ApiActivity = Omit<Activity, "date" | "organizationName" | "repositoryName" | "tags" | "number" | "link" | "description" | "notes"> & {
  date: string;
  organizationNameSnapshot: string;
  repositoryNameSnapshot: string;
  number?: string | null;
  link?: string | null;
  description?: string | null;
  notes?: string | null;
  tags?: unknown;
};

export const mapApiActivity = (activity: ApiActivity): Activity => ({
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

export const getActivity = async (id: string) => mapApiActivity(await apiRequest<ApiActivity>(`/activities/${encodeURIComponent(id)}`));
