import type { Prisma, Priority, ScheduledWorkStatus, ScheduledWorkType, WorkDifficulty } from "@prisma/client";
import { ApiError } from "../../utils/ApiError";
import { ScheduledWorkRepository } from "./scheduledWork.repository";

type ScheduledWorkPayload = {
  title?: string;
  type?: ScheduledWorkType;
  status?: ScheduledWorkStatus;
  priority?: Priority;
  organizationName?: string;
  repositoryName?: string;
  itemNumber?: number;
  itemUrl?: string;
  assignedToMe?: boolean;
  assignedSince?: string;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  labels?: string[];
  tags?: string[];
  difficulty?: WorkDifficulty;
  context?: string;
  plan?: string;
  blockers?: string;
  closingNotes?: string;
};

export class ScheduledWorkService {
  constructor(private repository = new ScheduledWorkRepository()) {}

  create(userId: string, payload: ScheduledWorkPayload) {
    return this.repository.create({ ...this.toDatabasePayload(payload), userId } as Prisma.ScheduledWorkUncheckedCreateInput);
  }

  async list(userId: string, query: Record<string, string | undefined>) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 60), 1), 100);
    const statusFilter = query.overdue === "true" ? { not: "DONE" as const } : query.status ? (query.status as ScheduledWorkStatus) : undefined;
    const where: Prisma.ScheduledWorkWhereInput = {
      userId,
      type: query.type ? (query.type as ScheduledWorkType) : undefined,
      status: statusFilter,
      priority: query.priority ? (query.priority as Priority) : undefined,
      assignedToMe: query.assignedToMe ? query.assignedToMe === "true" : undefined,
      organizationName: query.organizationName ? { contains: query.organizationName, mode: "insensitive" } : undefined,
      repositoryName: query.repositoryName ? { contains: query.repositoryName, mode: "insensitive" } : undefined,
      dueDate: {
        gte: query.startDate ? new Date(query.startDate) : undefined,
        lte: query.dueDate ? new Date(query.dueDate) : undefined,
        lt: query.overdue === "true" ? new Date() : undefined
      },
      OR: query.search
        ? [
            { title: { contains: query.search, mode: "insensitive" } },
            { organizationName: { contains: query.search, mode: "insensitive" } },
            { repositoryName: { contains: query.search, mode: "insensitive" } },
            { context: { contains: query.search, mode: "insensitive" } }
          ]
        : undefined
    };

    if (!query.startDate && !query.dueDate && query.overdue !== "true") delete where.dueDate;
    const [items, total] = await Promise.all([
      this.repository.findMany(where, (page - 1) * limit, limit),
      this.repository.count(where)
    ]);
    return { items, total, page, limit };
  }

  async get(userId: string, id: string) {
    const item = await this.repository.findByIdForUser(id, userId);
    if (!item) throw new ApiError(404, "Scheduled work not found");
    return item;
  }

  async update(userId: string, id: string, payload: ScheduledWorkPayload) {
    const current = await this.get(userId, id);
    const data = this.toDatabasePayload(payload);
    if (payload.status !== undefined) data.completedAt = payload.status === "DONE" ? current.completedAt ?? new Date() : null;
    return this.repository.update(id, data as Prisma.ScheduledWorkUncheckedUpdateInput);
  }

  async delete(userId: string, id: string) {
    await this.get(userId, id);
    return this.repository.delete(id);
  }

  async updateStatus(userId: string, id: string, status: ScheduledWorkStatus) {
    const current = await this.get(userId, id);
    return this.repository.update(id, { status, completedAt: status === "DONE" ? current.completedAt ?? new Date() : null });
  }

  markDone(userId: string, id: string) {
    return this.updateStatus(userId, id, "DONE");
  }

  markBlocked(userId: string, id: string) {
    return this.updateStatus(userId, id, "BLOCKED");
  }

  private toDatabasePayload(payload: ScheduledWorkPayload) {
    return {
      title: payload.title,
      type: payload.type,
      status: payload.status,
      priority: payload.priority,
      organizationName: payload.organizationName,
      repositoryName: payload.repositoryName,
      itemNumber: payload.itemNumber,
      itemUrl: payload.itemUrl === undefined ? undefined : payload.itemUrl || null,
      assignedToMe: payload.assignedToMe,
      assignedSince: this.toDate(payload.assignedSince),
      startDate: this.toDate(payload.startDate),
      dueDate: this.toDate(payload.dueDate),
      completedAt: this.toDate(payload.completedAt),
      estimatedHours: payload.estimatedHours,
      actualHours: payload.actualHours,
      labels: payload.labels ?? undefined,
      tags: payload.tags ?? undefined,
      difficulty: payload.difficulty,
      context: payload.context === undefined ? undefined : payload.context || null,
      plan: payload.plan === undefined ? undefined : payload.plan || null,
      blockers: payload.blockers === undefined ? undefined : payload.blockers || null,
      closingNotes: payload.closingNotes === undefined ? undefined : payload.closingNotes || null
    };
  }

  private toDate(value?: string) {
    return value ? new Date(value) : value === "" ? null : undefined;
  }
}
