import type { Activity } from "@/types/activity";
import type { Pin } from "@/types/pin";
import type { ScheduledWork } from "@/types/scheduledWork";

export type ProfileUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "VIEWER";
  createdAt: string;
};

export type ProfileSummary = ProfileUser & {
  _count: {
    activities: number;
    organizations: number;
    repositories: number;
    pins: number;
    scheduledWork: number;
  };
};

export type ProfileDashboard = {
  user: ProfileUser;
  stats: {
    activities: number;
    organizations: number;
    repositories: number;
    pins: number;
    scheduledWork: number;
  };
  activities: Activity[];
  favoritePins: Pin[];
  upcomingWork: ScheduledWork[];
};
