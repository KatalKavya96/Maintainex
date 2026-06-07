import type { Activity, ActivityType, Goal, GoalMetric, GoalPeriod, Organization, Pin, Repository, ScheduledWork } from "@prisma/client";
import { prisma } from "../../config/database";

type AiData = {
  user: { name: string; username: string };
  activities: Activity[];
  scheduledWork: ScheduledWork[];
  goals: Goal[];
  pins: Pin[];
  repositories: Repository[];
  organizations: Organization[];
};

type ComparisonDirection = "up" | "down" | "flat";

const activityLabels: Record<ActivityType, string> = {
  PR_REVIEWED: "PR reviews",
  PR_RAISED: "PRs raised",
  ISSUE_RAISED: "issues raised",
  PR_CLOSED: "PRs closed",
  ISSUE_CLOSED: "issues closed",
  COMMENTED: "comments",
  MERGED: "merged work",
  OTHER: "other activity"
};

const metricToActivity: Partial<Record<GoalMetric, ActivityType>> = {
  PR_RAISED: "PR_RAISED",
  PR_REVIEWED: "PR_REVIEWED",
  ISSUE_RAISED: "ISSUE_RAISED",
  ISSUE_CLOSED: "ISSUE_CLOSED",
  TOTAL_ACTIVITY: "OTHER"
};

const activeWorkStatuses = new Set(["PLANNED", "IN_PROGRESS", "BLOCKED", "POSTPONED"]);
const highPriority = new Set(["HIGH", "URGENT"]);

const startOfDay = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfWeek = (date = new Date()) => {
  const start = startOfDay(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const startOfMonth = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), 1);

const periodStart = (period: GoalPeriod) => {
  const now = new Date();
  const start = startOfDay(now);
  if (period === "DAILY") return start;
  if (period === "WEEKLY") return startOfWeek(now);
  if (period === "MONTHLY") return startOfMonth(now);
  if (period === "YEARLY") return new Date(now.getFullYear(), 0, 1);
  return undefined;
};

const toDateString = (date: Date) => date.toISOString().slice(0, 10);

const toStringArray = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
};

const sentence = (value: string) => {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return `${trimmed.slice(0, 1).toUpperCase()}${trimmed.slice(1)}${/[.!?]$/.test(trimmed) ? "" : "."}`;
};

const humanList = (items: string[]) => {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
};

const countBy = <T>(items: T[], key: (item: T) => string | undefined | null) => {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const value = key(item);
    if (!value) return;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return counts;
};

const topEntries = (counts: Map<string, number>, limit = 5) =>
  Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));

const activityCount = (activities: Activity[], type: ActivityType) => activities.filter((activity) => activity.activityType === type).length;

const repoKey = (activity: Pick<Activity, "organizationNameSnapshot" | "repositoryNameSnapshot">) =>
  `${activity.organizationNameSnapshot}/${activity.repositoryNameSnapshot}`;

const workRepoKey = (work: Pick<ScheduledWork, "organizationName" | "repositoryName">) => `${work.organizationName}/${work.repositoryName}`;

const isScheduledActive = (work: ScheduledWork) => activeWorkStatuses.has(work.status);

const isOverdue = (work: ScheduledWork) => Boolean(work.dueDate && isScheduledActive(work) && startOfDay(work.dueDate).getTime() < startOfDay().getTime());

const isDueSoon = (work: ScheduledWork) => {
  if (!work.dueDate || !isScheduledActive(work)) return false;
  const today = startOfDay();
  const due = startOfDay(work.dueDate);
  return due.getTime() >= today.getTime() && due.getTime() <= addDays(today, 7).getTime();
};

const compare = (label: string, current: number, previous: number) => {
  const changePercent = previous === 0 ? null : Math.round(((current - previous) / previous) * 100);
  let direction: ComparisonDirection = "flat";
  if (current > previous) direction = "up";
  if (current < previous) direction = "down";
  return { label, current, previous, changePercent, direction };
};

const inferFocusAreas = (textValues: string[], tags: string[]) => {
  const text = `${textValues.join(" ")} ${tags.join(" ")}`.toLowerCase();
  const areas: string[] = [];
  if (/(ui|theme|dark|light|visual|style|css|responsive|mobile|layout)/.test(text)) areas.push("UI polish");
  if (/(test|coverage|spec|ci|workflow|actions)/.test(text)) areas.push("testing and CI");
  if (/(doc|readme|guide|content)/.test(text)) areas.push("documentation");
  if (/(bug|fix|regression|error|crash)/.test(text)) areas.push("bug fixing");
  if (/(perf|speed|optimi[sz]e|latency)/.test(text)) areas.push("performance");
  if (/(api|backend|server|database|schema|prisma)/.test(text)) areas.push("backend systems");
  return Array.from(new Set(areas));
};

export class AiService {
  async weeklyReport(userId: string) {
    const data = await this.loadUserData(userId);
    const weekStart = startOfWeek();
    const weekEnd = addDays(weekStart, 7);
    const lastWeekStart = addDays(weekStart, -7);
    const weekActivities = data.activities.filter((activity) => activity.date >= weekStart && activity.date < weekEnd);
    const lastWeekActivities = data.activities.filter((activity) => activity.date >= lastWeekStart && activity.date < weekStart);
    const topRepository = topEntries(countBy(weekActivities, repoKey), 1)[0] ?? null;
    const topOrganization = topEntries(countBy(weekActivities, (activity) => activity.organizationNameSnapshot), 1)[0] ?? null;
    const effortTags = this.effortTags(weekActivities, data.scheduledWork);
    const overdue = data.scheduledWork.filter(isOverdue);
    const dueSoon = data.scheduledWork.filter(isDueSoon);
    const counts = {
      total: weekActivities.length,
      prReviewed: activityCount(weekActivities, "PR_REVIEWED"),
      prRaised: activityCount(weekActivities, "PR_RAISED"),
      issuesRaised: activityCount(weekActivities, "ISSUE_RAISED"),
      prClosed: activityCount(weekActivities, "PR_CLOSED"),
      issuesClosed: activityCount(weekActivities, "ISSUE_CLOSED")
    };
    const comparedToLastWeek = [
      compare("PR reviews", counts.prReviewed, activityCount(lastWeekActivities, "PR_REVIEWED")),
      compare("PRs raised", counts.prRaised, activityCount(lastWeekActivities, "PR_RAISED")),
      compare("Issue activity", counts.issuesRaised + counts.issuesClosed, activityCount(lastWeekActivities, "ISSUE_RAISED") + activityCount(lastWeekActivities, "ISSUE_CLOSED")),
      compare("Total activity", counts.total, lastWeekActivities.length)
    ];
    const suggestedFocus = this.suggestFocus(data, { topRepository, overdue, dueSoon, weekActivities });

    return {
      generatedAt: new Date().toISOString(),
      period: { start: toDateString(weekStart), end: toDateString(addDays(weekEnd, -1)) },
      headline:
        weekActivities.length > 0
          ? `You logged ${weekActivities.length} contribution${weekActivities.length === 1 ? "" : "s"} this week.`
          : "No activity has been logged for this week yet.",
      summary: [
        `Reviewed ${counts.prReviewed} PR${counts.prReviewed === 1 ? "" : "s"}, raised ${counts.prRaised} PR${counts.prRaised === 1 ? "" : "s"}, and raised ${counts.issuesRaised} issue${counts.issuesRaised === 1 ? "" : "s"}.`,
        topRepository ? `Most active repository: ${topRepository.name}.` : "No active repository stood out this week.",
        effortTags.length > 0 ? `Most visible effort area: ${humanList(effortTags.slice(0, 3))}.` : "Add tags to activities to improve effort insights."
      ],
      counts,
      topRepository,
      topOrganization,
      effortTags,
      comparedToLastWeek,
      suggestedFocus
    };
  }

  async progressCoach(userId: string, question: string) {
    const data = await this.loadUserData(userId);
    const normalized = question.toLowerCase();
    const overdue = data.scheduledWork.filter(isOverdue);
    const dueSoon = data.scheduledWork.filter(isDueSoon);
    const monthActivities = data.activities.filter((activity) => activity.date >= startOfMonth());
    const weekActivities = data.activities.filter((activity) => activity.date >= startOfWeek());
    const topRepo = topEntries(countBy(monthActivities, repoKey), 1)[0] ?? topEntries(countBy(data.activities, repoKey), 1)[0] ?? null;
    const neglectedRepo = this.neglectedRepository(data);
    const topOrg = topEntries(countBy(monthActivities, (activity) => activity.organizationNameSnapshot), 1)[0] ?? null;

    if (/(today|urgent|due|schedule|scheduled)/.test(normalized)) {
      const urgent = [...overdue, ...dueSoon].slice(0, 4);
      return {
        answer: urgent.length > 0 ? "Start with scheduled work that is overdue or due soon." : "You have no urgent scheduled work right now.",
        bullets: urgent.length > 0 ? urgent.map((work) => `${work.title} in ${workRepoKey(work)}${work.dueDate ? `, due ${toDateString(work.dueDate)}` : ""}.`) : this.defaultFocusBullets(data),
        dataPoints: [`${overdue.length} overdue`, `${dueSoon.length} due soon`, `${weekActivities.length} activities this week`]
      };
    }

    if (/(neglect|ignored|stale|repo)/.test(normalized)) {
      return {
        answer: neglectedRepo ? `${neglectedRepo.name} looks like the best repo to revisit.` : "No neglected repository is obvious yet because there is not enough repository history.",
        bullets: neglectedRepo
          ? [`Last seen ${neglectedRepo.lastActivityLabel}.`, `Plan one small issue, review, or documentation pass there this week.`]
          : this.defaultFocusBullets(data),
        dataPoints: [`${data.repositories.length} tracked repositories`, `${data.activities.length} total activities`]
      };
    }

    if (/(month|perform|performance|progress)/.test(normalized)) {
      return {
        answer: `This month you logged ${monthActivities.length} contribution${monthActivities.length === 1 ? "" : "s"}.`,
        bullets: [
          `PR reviews: ${activityCount(monthActivities, "PR_REVIEWED")}.`,
          `PRs raised: ${activityCount(monthActivities, "PR_RAISED")}.`,
          `Issues raised or closed: ${activityCount(monthActivities, "ISSUE_RAISED") + activityCount(monthActivities, "ISSUE_CLOSED")}.`,
          topRepo ? `Most active repo: ${topRepo.name}.` : "No repo has activity this month yet."
        ],
        dataPoints: [`${monthActivities.length} monthly activities`, `${weekActivities.length} this week`]
      };
    }

    if (/(org|organization|focus)/.test(normalized)) {
      return {
        answer: topOrg ? `Focus on ${topOrg.name}; it has the most momentum this month.` : "Pick the organization attached to your next scheduled work item.",
        bullets: topOrg
          ? [`${topOrg.name} has ${topOrg.count} monthly activit${topOrg.count === 1 ? "y" : "ies"}.`, ...this.defaultFocusBullets(data).slice(0, 2)]
          : this.defaultFocusBullets(data),
        dataPoints: [`${data.organizations.length} organizations`, `${data.repositories.length} repositories`]
      };
    }

    const report = await this.weeklyReport(userId);
    return {
      answer: "Here is the strongest next move based on your Maintainex data.",
      bullets: report.suggestedFocus,
      dataPoints: report.comparedToLastWeek.map((item) => `${item.label}: ${item.current} now, ${item.previous} last week`)
    };
  }

  async contributionPlan(userId: string) {
    const data = await this.loadUserData(userId);
    const urgent = [...data.scheduledWork.filter(isOverdue), ...data.scheduledWork.filter(isDueSoon)].slice(0, 5);
    const goals = this.goalsWithProgress(data).filter((goal) => goal.progress < goal.target).slice(0, 4);
    const topRepository = topEntries(countBy(data.activities, repoKey), 1)[0]?.name ?? data.repositories[0]?.name ?? "your most active repo";
    const days = Array.from({ length: 5 }, (_value, index) => {
      const date = addDays(startOfDay(), index);
      const scheduled = urgent[index];
      const goal = goals[index % Math.max(goals.length, 1)];
      const actions = [
        scheduled ? `Move "${scheduled.title}" forward in ${workRepoKey(scheduled)}.` : `Spend 30 minutes on ${topRepository}.`,
        goal ? `Advance goal "${goal.title}" from ${goal.progress}/${goal.target}.` : "Log one high-signal contribution note after the work.",
        index === 4 ? "Review what worked and update maintainer notes for the repo." : "Capture blockers or review notes while they are fresh."
      ];
      return {
        day: index + 1,
        date: toDateString(date),
        label: date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
        actions
      };
    });

    return {
      title: "5-day contribution plan",
      summary: urgent.length > 0 ? "Built from your urgent schedule and active goals." : "Built from your goals and recent contribution patterns.",
      days,
      sourceGoals: goals.map((goal) => ({ id: goal.id, title: goal.title, metric: goal.metric, target: goal.target, progress: goal.progress, percent: goal.percent })),
      urgentWork: urgent.map((work) => ({ id: work.id, title: work.title, repository: workRepoKey(work), priority: work.priority, dueDate: work.dueDate?.toISOString() ?? null }))
    };
  }

  async issuePrContext(userId: string, url: string) {
    const data = await this.loadUserData(userId);
    const parsed = this.parseGithubUrl(url);
    const organizationName = parsed?.owner ?? new URL(url).hostname.replace(/^www\./, "");
    const repositoryName = parsed?.repo ?? "unknown-repository";
    const isPullRequest = parsed?.kind === "pull";
    const repo = data.repositories.find((item) => item.name.toLowerCase() === repositoryName.toLowerCase());
    const org = data.organizations.find((item) => item.name.toLowerCase() === organizationName.toLowerCase());
    const memory = this.repoMemory(data).find((item) => item.repository.toLowerCase() === repositoryName.toLowerCase() || item.repo.toLowerCase() === `${organizationName}/${repositoryName}`.toLowerCase());
    const focusTags = memory?.focusAreas ?? [];
    const tags = Array.from(
      new Set([
        isPullRequest ? "review" : "triage",
        parsed?.kind === "issues" ? "issue" : "pull-request",
        repo?.primaryTechStack?.toLowerCase(),
        ...focusTags.map((tag) => tag.toLowerCase().replace(/\s+/g, "-"))
      ].filter((tag): tag is string => Boolean(tag)))
    ).slice(0, 6);

    return {
      sourceUrl: url,
      title: `${isPullRequest ? "Review PR" : "Triage issue"}${parsed?.number ? ` #${parsed.number}` : ""} in ${organizationName}/${repositoryName}`,
      organizationName,
      repositoryName,
      itemNumber: parsed?.number ?? null,
      contextType: isPullRequest ? "PULL_REQUEST" : "ISSUE",
      activityType: isPullRequest ? "PR_REVIEWED" : "ISSUE_RAISED",
      suggestedTags: tags,
      reviewChecklist: [
        "Confirm the change matches the issue or PR description.",
        "Check light and dark theme, responsiveness, and edge states when UI is touched.",
        "Look for tests, screenshots, or reproduction notes that prove the behavior.",
        "Leave a concise review note with one clear next action."
      ],
      possibleClosingReason: isPullRequest ? "MERGED after validation" : "COMPLETED when the linked fix lands",
      summary: memory
        ? `${memory.summary} Use that context while reviewing this ${isPullRequest ? "PR" : "issue"}.`
        : `Use this as a structured ${isPullRequest ? "PR review" : "issue triage"} entry for ${organizationName}/${repositoryName}.`,
      riskLevel: isPullRequest ? "MEDIUM" : "LOW",
      priority: highPriority.has(data.scheduledWork.find((work) => work.itemUrl === url)?.priority ?? "MEDIUM") ? "HIGH" : "MEDIUM",
      matchedRepositoryId: repo?.id ?? null,
      matchedOrganizationId: org?.id ?? null
    };
  }

  async reviewNotes(_userId: string, notes: string) {
    const clean = notes.trim().replace(/\s+/g, " ");
    const lower = clean.toLowerCase();
    const focus = inferFocusAreas([clean], []);
    const checklist = [
      /dark|light|theme|color|contrast/.test(lower) ? "Verify the change in both light and dark themes." : "Verify the behavior in the affected screen.",
      /mobile|responsive|width|overflow|layout/.test(lower) ? "Check mobile, tablet, and desktop viewport widths." : "Check for regressions around nearby UI states.",
      /test|coverage|spec/.test(lower) ? "Confirm the relevant test or coverage update is included." : "Ask for a test, screenshot, or reproduction note if proof is missing."
    ];

    return {
      professionalNote: `I reviewed this change and noticed that ${clean.charAt(0).toLowerCase()}${clean.slice(1)}. ${
        focus.length > 0 ? `This mainly affects ${humanList(focus.map((area) => area.toLowerCase()))}. ` : ""
      }Please make sure the update is consistent with the surrounding implementation and does not introduce regressions in adjacent states.`,
      checklist,
      tone: "constructive-review",
      shortSummary: sentence(clean)
    };
  }

  async maintainerMemory(userId: string) {
    const data = await this.loadUserData(userId);
    return {
      generatedAt: new Date().toISOString(),
      repositories: this.repoMemory(data)
    };
  }

  private async loadUserData(userId: string): Promise<AiData> {
    if (userId === "viewer") {
      return {
        user: { name: "Viewer", username: "viewer" },
        activities: [],
        scheduledWork: [],
        goals: [],
        pins: [],
        repositories: [],
        organizations: []
      };
    }

    const [user, activities, scheduledWork, goals, pins, repositories, organizations] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, username: true } }),
      prisma.activity.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 1000 }),
      prisma.scheduledWork.findMany({ where: { userId }, orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }], take: 200 }),
      prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.pin.findMany({ where: { userId, isArchived: false }, orderBy: [{ isFavorite: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }], take: 100 }),
      prisma.repository.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 200 }),
      prisma.organization.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 100 })
    ]);

    return { user, activities, scheduledWork, goals, pins, repositories, organizations };
  }

  private effortTags(activities: Activity[], scheduledWork: ScheduledWork[]) {
    const tags = [
      ...activities.flatMap((activity) => toStringArray(activity.tags)),
      ...scheduledWork.flatMap((work) => toStringArray(work.tags)),
      ...inferFocusAreas(
        activities.flatMap((activity) => [activity.title, activity.description ?? "", activity.notes ?? ""]),
        []
      )
    ];
    return topEntries(countBy(tags, (tag) => tag.toLowerCase()), 6).map((item) => item.name);
  }

  private suggestFocus(
    data: AiData,
    context: {
      topRepository: { name: string; count: number } | null;
      overdue: ScheduledWork[];
      dueSoon: ScheduledWork[];
      weekActivities: Activity[];
    }
  ) {
    const suggestions: string[] = [];
    const goals = this.goalsWithProgress(data).filter((goal) => goal.progress < goal.target);
    if (context.overdue.length > 0) suggestions.push(`Clear ${context.overdue.length} overdue scheduled task${context.overdue.length === 1 ? "" : "s"}.`);
    if (context.dueSoon.length > 0) suggestions.push(`Prepare ${context.dueSoon.length} task${context.dueSoon.length === 1 ? "" : "s"} due in the next 7 days.`);
    if (context.topRepository) suggestions.push(`Keep momentum in ${context.topRepository.name} with one focused review or issue.`);
    if (activityCount(context.weekActivities, "PR_REVIEWED") === 0) suggestions.push("Review at least one pending PR to keep maintainer activity balanced.");
    if (goals[0]) suggestions.push(`Push goal "${goals[0].title}" from ${goals[0].progress}/${goals[0].target}.`);
    if (data.pins.length > 0) suggestions.push(`Revisit pinned resource "${data.pins[0].title}" before choosing new work.`);
    return suggestions.slice(0, 5).length > 0 ? suggestions.slice(0, 5) : ["Add one activity and one scheduled task so Maintainex can generate sharper guidance."];
  }

  private defaultFocusBullets(data: AiData) {
    const overdue = data.scheduledWork.filter(isOverdue);
    const dueSoon = data.scheduledWork.filter(isDueSoon);
    const goals = this.goalsWithProgress(data).filter((goal) => goal.progress < goal.target);
    return [
      overdue[0] ? `Finish overdue work: ${overdue[0].title}.` : dueSoon[0] ? `Prepare due-soon work: ${dueSoon[0].title}.` : "Pick one small contribution and log it.",
      goals[0] ? `Advance goal "${goals[0].title}".` : "Create a monthly goal to make coaching more specific.",
      data.pins[0] ? `Use pinned resource "${data.pins[0].title}" as context.` : "Pin useful repo or issue links for future planning."
    ];
  }

  private goalsWithProgress(data: AiData) {
    return data.goals.map((goal) => {
      const start = goal.startsAt ?? periodStart(goal.period);
      const end = goal.endsAt ?? undefined;
      const scoped = data.activities.filter((activity) => (!start || activity.date >= start) && (!end || activity.date <= end));
      let progress = 0;
      if (goal.metric === "TOTAL_ACTIVITY") progress = scoped.length;
      else if (goal.metric === "REPO_CONTRIBUTIONS") progress = new Set(scoped.map(repoKey)).size;
      else if (goal.metric === "STREAK") progress = this.currentStreak(data.activities);
      else {
        const type = metricToActivity[goal.metric];
        progress = type ? activityCount(scoped, type) : 0;
      }
      return { ...goal, progress, percent: Math.min(100, Math.round((progress / goal.target) * 100)) };
    });
  }

  private currentStreak(activities: Activity[]) {
    const days = new Set(activities.map((activity) => toDateString(activity.date)));
    let streak = 0;
    const cursor = startOfDay();
    while (days.has(toDateString(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  private neglectedRepository(data: AiData) {
    const activityByRepo = countBy(data.activities, repoKey);
    const candidates = data.repositories.map((repo) => {
      const org = data.organizations.find((item) => item.id === repo.organizationId);
      const name = `${org?.name ?? "unknown"}/${repo.name}`;
      const lastActivity = data.activities.find((activity) => repoKey(activity).toLowerCase() === name.toLowerCase());
      return { name, count: activityByRepo.get(name) ?? 0, lastActivityAt: lastActivity?.date ?? null };
    });
    const sorted = candidates.sort((a, b) => {
      if (a.count !== b.count) return a.count - b.count;
      const aTime = a.lastActivityAt?.getTime() ?? 0;
      const bTime = b.lastActivityAt?.getTime() ?? 0;
      return aTime - bTime;
    });
    const candidate = sorted[0];
    if (!candidate) return null;
    return {
      name: candidate.name,
      lastActivityLabel: candidate.lastActivityAt ? toDateString(candidate.lastActivityAt) : "never"
    };
  }

  private parseGithubUrl(url: string) {
    const match = url.match(/^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/(pull|issues)\/(\d+)/i);
    if (!match) return null;
    return {
      owner: match[1],
      repo: match[2],
      kind: match[3] as "pull" | "issues",
      number: Number(match[4])
    };
  }

  private repoMemory(data: AiData) {
    const grouped = new Map<string, Activity[]>();
    data.activities.forEach((activity) => {
      const key = repoKey(activity);
      grouped.set(key, [...(grouped.get(key) ?? []), activity]);
    });

    return topEntries(countBy(data.activities, repoKey), 20).map(({ name, count }) => {
      const activities = grouped.get(name) ?? [];
      const [organization, repository] = name.split("/");
      const commonTags = topEntries(countBy(activities.flatMap((activity) => toStringArray(activity.tags)), (tag) => tag.toLowerCase()), 6).map((item) => item.name);
      const dominantActivityTypes = topEntries(countBy(activities, (activity) => activity.activityType), 4).map((item) => ({
        type: item.name,
        label: activityLabels[item.name as ActivityType] ?? item.name,
        count: item.count
      }));
      const focusAreas = inferFocusAreas(
        activities.flatMap((activity) => [activity.title, activity.description ?? "", activity.notes ?? ""]),
        commonTags
      );
      const lastActivityAt = activities[0]?.date ?? null;
      const reviewPattern = [
        activityCount(activities, "PR_REVIEWED") > 0 ? "checks PR implementation details" : null,
        focusAreas.includes("UI polish") ? "checks visual consistency and themes" : null,
        focusAreas.includes("testing and CI") ? "asks for tests or CI proof" : null,
        focusAreas.includes("documentation") ? "keeps contributor-facing docs clear" : null
      ].filter((item): item is string => Boolean(item));
      return {
        repo: name,
        organization,
        repository,
        totalActivities: count,
        dominantActivityTypes,
        commonTags,
        focusAreas: focusAreas.length > 0 ? focusAreas : ["general maintenance"],
        commonReviewPattern: reviewPattern.length > 0 ? reviewPattern : ["keeps notes concise", "tracks status and follow-up work"],
        lastActivityAt: lastActivityAt?.toISOString() ?? null,
        summary: `In ${name}, ${data.user.name} usually works on ${humanList((focusAreas.length > 0 ? focusAreas : ["general maintenance"]).map((area) => area.toLowerCase()))}.`
      };
    });
  }
}
