import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";

export class ScheduledWorkRepository {
  create(data: Prisma.ScheduledWorkUncheckedCreateInput) {
    return prisma.scheduledWork.create({ data });
  }

  findMany(where: Prisma.ScheduledWorkWhereInput, skip: number, take: number) {
    return prisma.scheduledWork.findMany({ where, orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }], skip, take });
  }

  count(where: Prisma.ScheduledWorkWhereInput) {
    return prisma.scheduledWork.count({ where });
  }

  findByIdForUser(id: string, userId: string) {
    return prisma.scheduledWork.findFirst({ where: { id, userId } });
  }

  update(id: string, data: Prisma.ScheduledWorkUncheckedUpdateInput) {
    return prisma.scheduledWork.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.scheduledWork.delete({ where: { id } });
  }
}
