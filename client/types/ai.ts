import type { ActivityType } from "@/types/activity";
import type { GoalMetric } from "@/types/social";

export type AiComparison = {
  label: string;
  current: number;
  previous: number;
  changePercent: number | null;
  direction: "up" | "down" | "flat";
};

export type AiWeeklyReport = {
  generatedAt: string;
  period: { start: string; end: string };
  headline: string;
  summary: string[];
  counts: {
    total: number;
    prReviewed: number;
    prRaised: number;
    issuesRaised: number;
    prClosed: number;
    issuesClosed: number;
  };
  topRepository: { name: string; count: number } | null;
  topOrganization: { name: string; count: number } | null;
  effortTags: string[];
  comparedToLastWeek: AiComparison[];
  suggestedFocus: string[];
};

export type AiCoachResponse = {
  answer: string;
  bullets: string[];
  dataPoints: string[];
};

export type AiContributionPlan = {
  title: string;
  summary: string;
  days: {
    day: number;
    date: string;
    label: string;
    actions: string[];
  }[];
  sourceGoals: {
    id: string;
    title: string;
    metric: GoalMetric;
    target: number;
    progress: number;
    percent: number;
  }[];
  urgentWork: {
    id: string;
    title: string;
    repository: string;
    priority: string;
    dueDate: string | null;
  }[];
};

export type AiIssuePrContext = {
  sourceUrl: string;
  title: string;
  organizationName: string;
  repositoryName: string;
  itemNumber: number | null;
  contextType: "PULL_REQUEST" | "ISSUE";
  activityType: ActivityType;
  suggestedTags: string[];
  reviewChecklist: string[];
  possibleClosingReason: string;
  summary: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  matchedRepositoryId: string | null;
  matchedOrganizationId: string | null;
};

export type AiReviewNotes = {
  professionalNote: string;
  checklist: string[];
  tone: string;
  shortSummary: string;
};

export type AiMaintainerMemory = {
  generatedAt: string;
  repositories: {
    repo: string;
    organization: string;
    repository: string;
    totalActivities: number;
    dominantActivityTypes: { type: string; label: string; count: number }[];
    commonTags: string[];
    focusAreas: string[];
    commonReviewPattern: string[];
    lastActivityAt: string | null;
    summary: string;
  }[];
};
