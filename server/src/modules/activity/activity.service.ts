import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { emitDashboardUpdate, emitToUser } from "../../realtime/socket";
import { ActivityRepository } from "./activity.repository";

type ActivityPayload = {
  date?: string;
  activityType?: Prisma.ActivityCreateInput["activityType"];
  title?: string;
  number?: string;
  link?: string;
  status?: Prisma.ActivityCreateInput["status"];
  reviewType?: Prisma.ActivityCreateInput["reviewType"];
  closingReason?: Prisma.ActivityCreateInput["closingReason"];
  description?: string;
  notes?: string;
  tags?: string[];
  organizationId?: string;
  repositoryId?: string;
  organizationName?: string;
  repositoryName?: string;
  organizationNameSnapshot?: string;
  repositoryNameSnapshot?: string;
};

export class ActivityService {
  constructor(private repository = new ActivityRepository()) {}

  async create(userId: string, payload: ActivityPayload) {
    await this.ensureRelationsBelongToUser(userId, payload);
    const activity = await this.repository.create({ ...this.toDatabasePayload(payload), userId } as Prisma.ActivityUncheckedCreateInput);
    emitDashboardUpdate(userId);
    const followers = await prisma.follow.findMany({ where: { followingId: userId }, select: { followerId: true } });
    followers.forEach((follow) => emitToUser(follow.followerId, "feed:new", { activityId: activity.id, userId, at: new Date().toISOString() }));
    return activity;
  }

  async list(userId: string, query: Record<string, string | undefined>) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const where: Prisma.ActivityWhereInput = {
      userId,
      activityType: query.type as Prisma.EnumActivityTypeFilter | undefined,
      status: query.status as Prisma.EnumActivityStatusFilter | undefined,
      closingReason: query.closingReason as Prisma.EnumClosingReasonFilter | undefined,
      reviewType: query.reviewType as Prisma.EnumReviewTypeFilter | undefined,
      organizationId: query.organizationId,
      repositoryId: query.repositoryId,
      date: {
        gte: query.startDate ? new Date(query.startDate) : undefined,
        lte: query.endDate ? new Date(query.endDate) : undefined
      },
      OR: query.search
        ? [
            { title: { contains: query.search } },
            { number: { contains: query.search } },
            { organizationNameSnapshot: { contains: query.search } },
            { repositoryNameSnapshot: { contains: query.search } }
          ]
        : undefined
    };

    if (!query.startDate && !query.endDate) delete where.date;

    const [items, total] = await Promise.all([
      this.repository.findMany(where, (page - 1) * limit, limit),
      this.repository.count(where)
    ]);
    return { items, total, page, limit };
  }

  async get(userId: string, id: string) {
    const activity = await this.repository.findByIdForUser(id, userId);
    if (!activity) throw new ApiError(404, "Activity not found");
    return activity;
  }

  async update(userId: string, id: string, payload: ActivityPayload) {
    await this.get(userId, id);
    await this.ensureRelationsBelongToUser(userId, payload);
    const activity = await this.repository.update(id, this.toDatabasePayload(payload) as Prisma.ActivityUncheckedUpdateInput);
    emitDashboardUpdate(userId);
    return activity;
  }

  async delete(userId: string, id: string) {
    await this.get(userId, id);
    const activity = await this.repository.delete(id);
    emitDashboardUpdate(userId);
    return activity;
  }

  async deleteAll(userId: string) {
    const result = await this.repository.deleteAll(userId);
    emitDashboardUpdate(userId);
    return result;
  }

  private toDatabasePayload(payload: ActivityPayload) {
    const organizationNameSnapshot = payload.organizationNameSnapshot ?? payload.organizationName;
    const repositoryNameSnapshot = payload.repositoryNameSnapshot ?? payload.repositoryName;

    return {
      date: payload.date ? new Date(payload.date) : undefined,
      activityType: payload.activityType,
      title: payload.title,
      number: payload.number ?? null,
      link: payload.link ?? null,
      status: payload.status,
      reviewType: payload.reviewType,
      closingReason: payload.closingReason,
      description: payload.description ?? null,
      notes: payload.notes ?? null,
      tags: payload.tags ?? [],
      organizationId: payload.organizationId || undefined,
      repositoryId: payload.repositoryId || undefined,
      organizationNameSnapshot,
      repositoryNameSnapshot
    };
  }

  private async ensureRelationsBelongToUser(userId: string, payload: ActivityPayload) {
    if (payload.organizationId) {
      const organization = await prisma.organization.findFirst({ where: { id: payload.organizationId, userId }, select: { id: true } });
      if (!organization) throw new ApiError(400, "Organization does not belong to this user");
    }

    if (payload.repositoryId) {
      const repository = await prisma.repository.findFirst({ where: { id: payload.repositoryId, userId }, select: { id: true } });
      if (!repository) throw new ApiError(400, "Repository does not belong to this user");
    }
  }
}
