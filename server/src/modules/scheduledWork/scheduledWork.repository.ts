import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../../config/database";

export class ScheduledWorkRepository {
  constructor(private db: PrismaClient = prisma) {}

  create(data: Prisma.ScheduledWorkUncheckedCreateInput) {
    return this.db.scheduledWork.create({ data });
  }

  findMany(where: Prisma.ScheduledWorkWhereInput, skip: number, take: number) {
    return this.db.scheduledWork.findMany({ where, orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }], skip, take });
  }

  count(where: Prisma.ScheduledWorkWhereInput) {
    return this.db.scheduledWork.count({ where });
  }

  findByIdForUser(id: string, userId: string) {
    return this.db.scheduledWork.findFirst({ where: { id, userId }, include: { userQuest: { select: { questId: true } } } });
  }

  update(id: string, data: Prisma.ScheduledWorkUncheckedUpdateInput) {
    return this.db.$transaction(async (tx) => {
      const work = await tx.scheduledWork.update({ where: { id }, data });
      if (data.status !== undefined) {
        await tx.userQuest.updateMany({
          where: { scheduledWorkId: id, userId: work.userId, ...(work.status === "DONE" ? {} : { status: "COMPLETED" }) },
          data: { status: work.status === "DONE" ? "COMPLETED" : "STARTED", completedAt: work.status === "DONE" ? work.completedAt ?? new Date() : null }
        });
      }
      return work;
    });
  }

  delete(id: string) {
    return this.db.scheduledWork.delete({ where: { id } });
  }
}
