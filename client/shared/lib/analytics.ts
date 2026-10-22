import type { Activity, ActivityType } from "@/types/activity";

export const countsBy = <T extends string>(items: T[]) =>
  items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});

const inSameWeek = (date: string, now = new Date()) => {
  const target = new Date(`${date}T00:00:00`);
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return target >= start && target < end;
};

export const summaryStats = (activities: Activity[]) => {
  const organizations = new Set(activities.map((activity) => activity.organizationName));
  const repositories = new Set(activities.map((activity) => `${activity.organizationName}/${activity.repositoryName}`));
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());

  return [
    { label: "Total Activities", value: activities.length },
    { label: "PRs Reviewed", value: activities.filter((item) => item.activityType === "PR_REVIEWED").length },
    { label: "PRs Raised", value: activities.filter((item) => item.activityType === "PR_RAISED").length },
    { label: "Issues Raised", value: activities.filter((item) => item.activityType === "ISSUE_RAISED").length },
    { label: "PRs Closed", value: activities.filter((item) => item.activityType === "PR_CLOSED").length },
    { label: "Issues Closed", value: activities.filter((item) => item.activityType === "ISSUE_CLOSED").length },
    { label: "Organizations", value: organizations.size },
    { label: "Repositories", value: repositories.size },
    { label: "This Week", value: activities.filter((item) => inSameWeek(item.date, now)).length },
    { label: "This Month", value: activities.filter((item) => item.date.startsWith(`${year}-${month}`)).length },
    { label: "This Year", value: activities.filter((item) => item.date.startsWith(year)).length }
  ];
};

export const chartByDate = (activities: Activity[]) =>
  Object.entries(countsBy(activities.map((activity) => activity.date)))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

export const chartByType = (activities: Activity[]) =>
  Object.entries(countsBy(activities.map((activity) => activity.activityType as ActivityType))).map(([name, value]) => ({
    name,
    value
  }));

export const chartByRepository = (activities: Activity[]) =>
  Object.entries(countsBy(activities.map((activity) => activity.repositoryName))).map(([name, value]) => ({ name, value }));

export const chartByOrganization = (activities: Activity[]) =>
  Object.entries(countsBy(activities.map((activity) => activity.organizationName))).map(([name, value]) => ({
    name,
    value
  }));
