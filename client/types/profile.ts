import type { Activity } from "@/types/activity";
import type { Pin } from "@/types/pin";
import type { ScheduledWork } from "@/types/scheduledWork";

export type ProfileUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "ADMIN" | "VIEWER";
  bio?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  xUrl?: string | null;
  leetcodeUrl?: string | null;
  portfolioUrl?: string | null;
  usernameUpdatedAt?: string | null;
  skills?: string[] | null;
  mainOrganizations?: string[] | null;
  createdAt: string;
};

export type ProfileUpdateInput = {
  name?: string;
  username?: string;
  bio?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  xUrl?: string | null;
  leetcodeUrl?: string | null;
  portfolioUrl?: string | null;
  skills?: string[];
  mainOrganizations?: string[];
};

export type UsernameAvailability = {
  username: string;
  available: boolean;
  canChange: boolean;
  nextChangeAt?: string | null;
  message: string;
};

export type ProfileSummary = ProfileUser & {
  _count: {
    activities: number;
    organizations: number;
    repositories: number;
    pins: number;
    scheduledWork: number;
    followers: number;
    following: number;
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
    followers: number;
    following: number;
    isFollowing: boolean;
  };
  activities: Activity[];
  favoritePins: Pin[];
  upcomingWork: ScheduledWork[];
};
