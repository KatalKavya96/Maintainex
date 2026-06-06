import type { Goal, GoalMetric, GoalPeriod, Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { emitToUser } from "../../realtime/socket";
import { ApiError } from "../../utils/ApiError";

type GoalPayload = {
  title?: string;
  metric?: GoalMetric;
  target?: number;
  period?: GoalPeriod;
  startsAt?: string;
  endsAt?: string;
};

const periodStart = (period: GoalPeriod) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "DAILY") return start;
  if (period === "WEEKLY") {
    start.setDate(start.getDate() - start.getDay());
    return start;
  }
  if (period === "MONTHLY") {
    start.setDate(1);
    return start;
  }
  if (period === "YEARLY") {
    start.setMonth(0, 1);
    return start;
  }
  return undefined;
};

const currentStreak = (dates: Date[]) => {
  const days = new Set(dates.map((date) => date.toISOString().slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export class GoalService {
  async list(userId: string) {
    const goals = await prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return Promise.all(goals.map((goal) => this.withProgress(goal)));
  }

  async create(userId: string, payload: GoalPayload) {
    const goal = await prisma.goal.create({
      data: {
        userId,
        title: payload.title ?? "New goal",
        metric: payload.metric ?? "TOTAL_ACTIVITY",
        target: payload.target ?? 1,
        period: payload.period ?? "MONTHLY",
        startsAt: payload.startsAt ? new Date(payload.startsAt) : null,
        endsAt: payload.endsAt ? new Date(payload.endsAt) : null
      }
    });
    return this.withProgress(goal);
  }

  async update(userId: string, id: string, payload: GoalPayload) {
    await this.ensureOwned(userId, id);
    const goal = await prisma.goal.update({
      where: { id },
      data: {
        title: payload.title,
        metric: payload.metric,
        target: payload.target,
        period: payload.period,
        startsAt: payload.startsAt ? new Date(payload.startsAt) : undefined,
        endsAt: payload.endsAt ? new Date(payload.endsAt) : undefined
      }
    });
    return this.withProgress(goal);
  }

  async delete(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    return prisma.goal.delete({ where: { id } });
  }

  private async ensureOwned(userId: string, id: string) {
    const goal = await prisma.goal.findFirst({ where: { id, userId }, select: { id: true } });
    if (!goal) throw new ApiError(404, "Goal not found");
  }

  private async withProgress(goal: Goal) {
    const start = goal.startsAt ?? periodStart(goal.period);
    const end = goal.endsAt ?? undefined;
    const where: Prisma.ActivityWhereInput = {
      userId: goal.userId,
      date: start || end ? { gte: start, lte: end } : undefined
    };
    if (!start && !end) delete where.date;

    let progress = 0;
    if (goal.metric === "PR_RAISED") progress = await prisma.activity.count({ where: { ...where, activityType: "PR_RAISED" } });
    if (goal.metric === "PR_REVIEWED") progress = await prisma.activity.count({ where: { ...where, activityType: "PR_REVIEWED" } });
    if (goal.metric === "ISSUE_RAISED") progress = await prisma.activity.count({ where: { ...where, activityType: "ISSUE_RAISED" } });
    if (goal.metric === "ISSUE_CLOSED") progress = await prisma.activity.count({ where: { ...where, activityType: "ISSUE_CLOSED" } });
    if (goal.metric === "TOTAL_ACTIVITY") progress = await prisma.activity.count({ where });
    if (goal.metric === "REPO_CONTRIBUTIONS") {
      const activities = await prisma.activity.findMany({ where, select: { repositoryNameSnapshot: true, organizationNameSnapshot: true } });
      progress = new Set(activities.map((activity) => `${activity.organizationNameSnapshot}/${activity.repositoryNameSnapshot}`)).size;
    }
    if (goal.metric === "STREAK") {
      const activities = await prisma.activity.findMany({ where: { userId: goal.userId }, select: { date: true } });
      progress = currentStreak(activities.map((activity) => activity.date));
    }

    const isCompleted = progress >= goal.target;
    if (isCompleted && !goal.isCompleted) {
      await prisma.goal.update({ where: { id: goal.id }, data: { isCompleted: true, completedAt: new Date() } });
      const notification = await prisma.notification.create({
        data: {
          recipientId: goal.userId,
          type: "GOAL",
          title: "Goal completed",
          body: `You completed "${goal.title}".`
        }
      });
      emitToUser(goal.userId, "notification:new", notification);
    }

    return { ...goal, progress, percent: Math.min(100, Math.round((progress / goal.target) * 100)), isCompleted };
  }
}
