import type { Activity, ActivityType, Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { emitToUser } from "../../realtime/socket";
import { ApiError } from "../../utils/ApiError";

const publicUserSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  bio: true,
  githubUrl: true,
  linkedinUrl: true,
  portfolioUrl: true,
  skills: true,
  mainOrganizations: true,
  role: true,
  createdAt: true
} satisfies Prisma.UserSelect;

const scoreFor = (counts: Record<string, number>, scheduledDone: number) =>
  (counts.PR_RAISED ?? 0) * 10 +
  (counts.PR_REVIEWED ?? 0) * 7 +
  (counts.ISSUE_RAISED ?? 0) * 5 +
  (counts.ISSUE_CLOSED ?? 0) * 8 +
  scheduledDone * 4;

const countTypes = (activities: Pick<Activity, "activityType">[]) =>
  activities.reduce<Record<string, number>>((acc, activity) => {
    acc[activity.activityType] = (acc[activity.activityType] ?? 0) + 1;
    return acc;
  }, {});

const currentStreak = (activities: Pick<Activity, "date">[]) => {
  const days = new Set(activities.map((activity) => activity.date.toISOString().slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const longestStreak = (activities: Pick<Activity, "date">[]) => {
  const days = Array.from(new Set(activities.map((activity) => activity.date.toISOString().slice(0, 10)))).sort();
  let best = 0;
  let current = 0;
  let previous: Date | null = null;
  for (const day of days) {
    const date = new Date(`${day}T00:00:00`);
    const expected = previous ? new Date(previous) : null;
    if (expected) expected.setDate(expected.getDate() + 1);
    current = expected && expected.toISOString().slice(0, 10) === day ? current + 1 : 1;
    best = Math.max(best, current);
    previous = date;
  }
  return best;
};

export class SocialService {
  async follow(currentUserId: string, followingId: string) {
    if (currentUserId === followingId) throw new ApiError(400, "You cannot follow yourself");
    const user = await prisma.user.findUnique({ where: { id: followingId }, select: { id: true, name: true } });
    if (!user) throw new ApiError(404, "User not found");

    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: currentUserId, followingId } },
      update: {},
      create: { followerId: currentUserId, followingId }
    });

    const notification = await prisma.notification.create({
      data: {
        recipientId: followingId,
        actorId: currentUserId,
        type: "SOCIAL",
        title: "New follower",
        body: "Someone followed your Maintainex profile."
      }
    });
    emitToUser(followingId, "notification:new", notification);

    return { following: true };
  }

  async unfollow(currentUserId: string, followingId: string) {
    await prisma.follow.deleteMany({ where: { followerId: currentUserId, followingId } });
    return { following: false };
  }

  async followers(username: string) {
    const user = await this.userByUsername(username);
    return prisma.follow.findMany({
      where: { followingId: user.id },
      include: { follower: { select: publicUserSelect } },
      orderBy: { createdAt: "desc" }
    });
  }

  async following(username: string) {
    const user = await this.userByUsername(username);
    return prisma.follow.findMany({
      where: { followerId: user.id },
      include: { following: { select: publicUserSelect } },
      orderBy: { createdAt: "desc" }
    });
  }

  async feed(currentUserId: string, query: Record<string, string | undefined>) {
    const follows = await prisma.follow.findMany({ where: { followerId: currentUserId }, select: { followingId: true } });
    const followedIds = follows.map((follow) => follow.followingId);
    if (query.scope !== "all") followedIds.push(currentUserId);
    const userIds = Array.from(new Set(followedIds));
    if (!userIds.length) return [];

    const activityType = this.feedActivityType(query.filter);
    const where: Prisma.ActivityWhereInput = {
      userId: { in: userIds },
      activityType,
      organizationNameSnapshot: query.organization || undefined,
      repositoryNameSnapshot: query.repository || undefined
    };

    const activities = await prisma.activity.findMany({
      where,
      include: { user: { select: publicUserSelect } },
      orderBy: { createdAt: "desc" },
      take: 80
    });

    return activities.map((activity) => ({
      id: activity.id,
      kind: "ACTIVITY",
      createdAt: activity.createdAt,
      user: activity.user,
      text: `${activity.user.name} ${this.activityVerb(activity.activityType)} ${activity.number ? `#${activity.number}` : activity.title} in ${activity.organizationNameSnapshot}/${activity.repositoryNameSnapshot}`,
      activity: {
        ...activity,
        organizationName: activity.organizationNameSnapshot,
        repositoryName: activity.repositoryNameSnapshot
      }
    }));
  }

  async leaderboard(query: Record<string, string | undefined>) {
    const now = new Date();
    const start = new Date(now);
    if (query.period === "weekly") start.setDate(now.getDate() - 7);
    if (query.period === "monthly") start.setMonth(now.getMonth() - 1);
    if (query.period === "yearly") start.setFullYear(now.getFullYear() - 1);

    const users = await prisma.user.findMany({
      select: {
        ...publicUserSelect,
        activities: {
          where: query.period ? { date: { gte: start } } : undefined,
          select: { activityType: true, date: true }
        },
        scheduledWork: {
          where: { status: "DONE", ...(query.period ? { completedAt: { gte: start } } : {}) },
          select: { id: true }
        }
      }
    });

    return users
      .map((user) => {
        const counts = countTypes(user.activities);
        return {
          user,
          counts,
          scheduledDone: user.scheduledWork.length,
          streak: currentStreak(user.activities),
          score: scoreFor(counts, user.scheduledWork.length)
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  async badges(username: string) {
    const user = await this.userByUsername(username);
    const [activities, repos] = await Promise.all([
      prisma.activity.findMany({ where: { userId: user.id }, select: { activityType: true, date: true, organizationNameSnapshot: true } }),
      prisma.repository.count({ where: { userId: user.id } })
    ]);
    const counts = countTypes(activities);
    const streak = longestStreak(activities);

    const badges = [
      { name: "First PR Reviewed", earned: (counts.PR_REVIEWED ?? 0) >= 1 },
      { name: "10 PRs Reviewed", earned: (counts.PR_REVIEWED ?? 0) >= 10 },
      { name: "50 PRs Reviewed", earned: (counts.PR_REVIEWED ?? 0) >= 50 },
      { name: "100 PRs Reviewed", earned: (counts.PR_REVIEWED ?? 0) >= 100 },
      { name: "First Issue Raised", earned: (counts.ISSUE_RAISED ?? 0) >= 1 },
      { name: "7-Day Streak", earned: streak >= 7 },
      { name: "30-Day Streak", earned: streak >= 30 },
      { name: "Bug Hunter", earned: (counts.ISSUE_CLOSED ?? 0) >= 5 },
      { name: "Review Machine", earned: (counts.PR_REVIEWED ?? 0) >= 25 },
      { name: "Maintainer Mode", earned: repos >= 5 },
      { name: "Consistency King", earned: streak >= 14 }
    ];

    return badges;
  }

  async compare(currentUserId: string, username: string) {
    const other = await this.userByUsername(username);
    const [currentActivities, otherActivities] = await Promise.all([
      prisma.activity.findMany({ where: { userId: currentUserId }, select: { activityType: true, date: true } }),
      prisma.activity.findMany({ where: { userId: other.id }, select: { activityType: true, date: true } })
    ]);
    const currentCounts = countTypes(currentActivities);
    const otherCounts = countTypes(otherActivities);
    return {
      current: { counts: currentCounts, streak: currentStreak(currentActivities), score: scoreFor(currentCounts, 0) },
      other: { user: other, counts: otherCounts, streak: currentStreak(otherActivities), score: scoreFor(otherCounts, 0) }
    };
  }

  async notifications(currentUserId: string) {
    const stored = await prisma.notification.findMany({
      where: { recipientId: currentUserId },
      include: { actor: { select: publicUserSelect } },
      orderBy: { createdAt: "desc" },
      take: 80
    });
    const now = new Date();
    const soon = new Date(now);
    soon.setDate(now.getDate() + 2);
    const scheduled = await prisma.scheduledWork.findMany({
      where: {
        userId: currentUserId,
        dueDate: { lte: soon },
        status: { notIn: ["DONE", "CANCELLED"] }
      },
      orderBy: { dueDate: "asc" },
      take: 20
    });

    const computed = scheduled.map((item) => {
      const overdue = item.dueDate ? item.dueDate < now : false;
      return {
        id: `scheduled-${item.id}`,
        recipientId: currentUserId,
        actorId: null,
        type: "SCHEDULE",
        title: overdue ? "Scheduled work overdue" : "Scheduled work due soon",
        body: overdue ? `You have overdue scheduled work: "${item.title}".` : `Your scheduled work "${item.title}" is due soon.`,
        metadata: { scheduledWorkId: item.id },
        readAt: null,
        createdAt: item.dueDate ?? item.createdAt,
        actor: null
      };
    });

    return [...computed, ...stored].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markNotificationRead(currentUserId: string, id: string) {
    return prisma.notification.updateMany({ where: { id, recipientId: currentUserId }, data: { readAt: new Date() } });
  }

  private async userByUsername(username: string) {
    const user = await prisma.user.findUnique({ where: { username }, select: publicUserSelect });
    if (!user) throw new ApiError(404, "User not found");
    return user;
  }

  private feedActivityType(filter?: string): ActivityType | undefined {
    if (filter === "pr-reviews") return "PR_REVIEWED";
    if (filter === "issues") return "ISSUE_RAISED";
    if (filter === "closed-prs") return "PR_CLOSED";
    return undefined;
  }

  private activityVerb(type: ActivityType) {
    if (type === "PR_REVIEWED") return "reviewed PR";
    if (type === "PR_RAISED") return "raised PR";
    if (type === "ISSUE_RAISED") return "raised issue";
    if (type === "ISSUE_CLOSED") return "closed issue";
    if (type === "PR_CLOSED") return "closed PR";
    if (type === "MERGED") return "merged";
    if (type === "COMMENTED") return "commented on";
    return "logged activity";
  }
}
