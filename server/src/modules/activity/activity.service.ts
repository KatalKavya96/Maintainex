import type { Prisma } from "@prisma/client";
import { ApiError } from "../../utils/ApiError";
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

  create(payload: ActivityPayload) {
    return this.repository.create(this.toDatabasePayload(payload) as Prisma.ActivityUncheckedCreateInput);
  }

  async list(query: Record<string, string | undefined>) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const where: Prisma.ActivityWhereInput = {
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

  async get(id: string) {
    const activity = await this.repository.findById(id);
    if (!activity) throw new ApiError(404, "Activity not found");
    return activity;
  }

  async update(id: string, payload: ActivityPayload) {
    await this.get(id);
    return this.repository.update(id, this.toDatabasePayload(payload) as Prisma.ActivityUncheckedUpdateInput);
  }

  async delete(id: string) {
    await this.get(id);
    return this.repository.delete(id);
  }

  deleteAll() {
    return this.repository.deleteAll();
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
}
