import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";

export class RepositoryRepository {
  create(data: Prisma.RepositoryUncheckedCreateInput) {
    return prisma.repository.create({ data });
  }

  findMany() {
    return prisma.repository.findMany({ include: { organization: true }, orderBy: { name: "asc" } });
  }

  findById(id: string) {
    return prisma.repository.findUnique({ where: { id }, include: { organization: true, activities: true } });
  }

  update(id: string, data: Prisma.RepositoryUncheckedUpdateInput) {
    return prisma.repository.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.repository.delete({ where: { id } });
  }
}
