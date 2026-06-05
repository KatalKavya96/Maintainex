import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";

export class RepositoryRepository {
  create(data: Prisma.RepositoryUncheckedCreateInput) {
    return prisma.repository.create({ data });
  }

  findMany(userId: string) {
    return prisma.repository.findMany({ where: { userId }, include: { organization: true }, orderBy: { name: "asc" } });
  }

  findByIdForUser(id: string, userId: string) {
    return prisma.repository.findFirst({ where: { id, userId }, include: { organization: true, activities: true } });
  }

  update(id: string, data: Prisma.RepositoryUncheckedUpdateInput) {
    return prisma.repository.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.repository.delete({ where: { id } });
  }
}
