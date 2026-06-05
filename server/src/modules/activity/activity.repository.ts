import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";

export class ActivityRepository {
  create(data: Prisma.ActivityUncheckedCreateInput) {
    return prisma.activity.create({ data });
  }

  findMany(where: Prisma.ActivityWhereInput, skip: number, take: number) {
    return prisma.activity.findMany({
      where,
      include: { organization: true, repository: true },
      orderBy: { date: "desc" },
      skip,
      take
    });
  }

  count(where: Prisma.ActivityWhereInput) {
    return prisma.activity.count({ where });
  }

  findById(id: string) {
    return prisma.activity.findUnique({ where: { id }, include: { organization: true, repository: true } });
  }

  update(id: string, data: Prisma.ActivityUncheckedUpdateInput) {
    return prisma.activity.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.activity.delete({ where: { id } });
  }

  deleteAll() {
    return prisma.activity.deleteMany();
  }
}
