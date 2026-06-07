import type { Activity, ActivityReactionType, ActivityShareTarget, ActivityType, Prisma } from "@prisma/client";
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
  xUrl: true,
  leetcodeUrl: true,
  portfolioUrl: true,
  usernameUpdatedAt: true,
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
    const engagement = await this.engagementSummary(currentUserId, activities.map((activity) => activity.id));

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
      },
      engagement: engagement[activity.id] ?? this.emptyEngagement()
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

  async engagement(currentUserId: string, activityId: string) {
    await this.publicActivity(activityId);
    const summary = await this.engagementSummary(currentUserId, [activityId]);
    return summary[activityId] ?? this.emptyEngagement();
  }

  async react(currentUserId: string, activityId: string, type: ActivityReactionType) {
    const activity = await this.publicActivity(activityId);
    await prisma.activityReaction.upsert({
      where: { activityId_userId_type: { activityId, userId: currentUserId, type } },
      update: {},
      create: { activityId, userId: currentUserId, type }
    });
    await this.notifyActivityOwner(activity, currentUserId, "New reaction", "Someone reacted to your Maintainex activity.");
    return this.engagement(currentUserId, activityId);
  }

  async unreact(currentUserId: string, activityId: string, type: ActivityReactionType) {
    await prisma.activityReaction.deleteMany({ where: { activityId, userId: currentUserId, type } });
    return this.engagement(currentUserId, activityId);
  }

  async comments(currentUserId: string, activityId: string) {
    await this.publicActivity(activityId);
    const comments = await prisma.activityComment.findMany({
      where: { activityId, deletedAt: null },
      include: { user: { select: publicUserSelect } },
      orderBy: { createdAt: "asc" },
      take: 100
    });
    const engagement = await this.engagement(currentUserId, activityId);
    return { comments, engagement };
  }

  async comment(currentUserId: string, activityId: string, body: string) {
    const clean = body.trim();
    if (!clean) throw new ApiError(400, "Comment cannot be empty");
    if (clean.length > 1200) throw new ApiError(400, "Comment is too long");
    const activity = await this.publicActivity(activityId);
    const comment = await prisma.activityComment.create({
      data: { activityId, userId: currentUserId, body: clean },
      include: { user: { select: publicUserSelect } }
    });
    await this.notifyActivityOwner(activity, currentUserId, "New comment", "Someone commented on your Maintainex activity.");
    return comment;
  }

  async deleteComment(currentUserId: string, activityId: string, commentId: string) {
    const activity = await this.publicActivity(activityId);
    const comment = await prisma.activityComment.findFirst({ where: { id: commentId, activityId } });
    if (!comment) throw new ApiError(404, "Comment not found");
    if (comment.userId !== currentUserId && activity.userId !== currentUserId) throw new ApiError(403, "You cannot delete this comment");
    await prisma.activityComment.update({ where: { id: commentId }, data: { deletedAt: new Date(), body: "" } });
    return { deleted: true };
  }

  async bookmark(currentUserId: string, activityId: string) {
    await this.publicActivity(activityId);
    await prisma.activityBookmark.upsert({
      where: { activityId_userId: { activityId, userId: currentUserId } },
      update: {},
      create: { activityId, userId: currentUserId }
    });
    return this.engagement(currentUserId, activityId);
  }

  async unbookmark(currentUserId: string, activityId: string) {
    await prisma.activityBookmark.deleteMany({ where: { activityId, userId: currentUserId } });
    return this.engagement(currentUserId, activityId);
  }

  async share(currentUserId: string, activityId: string, target: ActivityShareTarget = "COPY_LINK") {
    await this.publicActivity(activityId);
    await prisma.activityShare.create({ data: { activityId, userId: currentUserId, target } });
    return {
      shareUrl: `/activities/${activityId}`,
      engagement: await this.engagement(currentUserId, activityId)
    };
  }

  private async userByUsername(username: string) {
    const user = await prisma.user.findUnique({ where: { username }, select: publicUserSelect });
    if (!user) throw new ApiError(404, "User not found");
    return user;
  }

  private async publicActivity(activityId: string) {
    const activity = await prisma.activity.findUnique({ where: { id: activityId }, include: { user: { select: publicUserSelect } } });
    if (!activity) throw new ApiError(404, "Activity not found");
    return activity;
  }

  private async engagementSummary(currentUserId: string, activityIds: string[]) {
    if (!activityIds.length) return {};
    const [reactionGroups, comments, bookmarks, shares, viewerReactions, viewerBookmarks] = await Promise.all([
      prisma.activityReaction.groupBy({ by: ["activityId", "type"], where: { activityId: { in: activityIds } }, _count: { _all: true } }),
      prisma.activityComment.groupBy({ by: ["activityId"], where: { activityId: { in: activityIds }, deletedAt: null }, _count: { _all: true } }),
      prisma.activityBookmark.groupBy({ by: ["activityId"], where: { activityId: { in: activityIds } }, _count: { _all: true } }),
      prisma.activityShare.groupBy({ by: ["activityId"], where: { activityId: { in: activityIds } }, _count: { _all: true } }),
      prisma.activityReaction.findMany({ where: { activityId: { in: activityIds }, userId: currentUserId }, select: { activityId: true, type: true } }),
      prisma.activityBookmark.findMany({ where: { activityId: { in: activityIds }, userId: currentUserId }, select: { activityId: true } })
    ]);

    const byId = Object.fromEntries(activityIds.map((id) => [id, this.emptyEngagement()]));
    reactionGroups.forEach((group) => {
      byId[group.activityId].reactionCounts[group.type] = group._count._all;
    });
    comments.forEach((group) => {
      byId[group.activityId].commentCount = group._count._all;
    });
    bookmarks.forEach((group) => {
      byId[group.activityId].bookmarkCount = group._count._all;
    });
    shares.forEach((group) => {
      byId[group.activityId].shareCount = group._count._all;
    });
    viewerReactions.forEach((reaction) => {
      byId[reaction.activityId].viewerReactionTypes.push(reaction.type);
    });
    viewerBookmarks.forEach((bookmark) => {
      byId[bookmark.activityId].viewerBookmarked = true;
    });
    return byId;
  }

  private emptyEngagement() {
    return {
      reactionCounts: { LIKE: 0, FIRE: 0, CLAP: 0, EYES: 0 },
      viewerReactionTypes: [] as ActivityReactionType[],
      commentCount: 0,
      bookmarkCount: 0,
      shareCount: 0,
      viewerBookmarked: false
    };
  }

  private async notifyActivityOwner(activity: Activity, actorId: string, title: string, body: string) {
    if (activity.userId === actorId) return;
    const notification = await prisma.notification.create({
      data: {
        recipientId: activity.userId,
        actorId,
        type: "SOCIAL",
        title,
        body,
        metadata: { activityId: activity.id }
      }
    });
    emitToUser(activity.userId, "notification:new", notification);
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
