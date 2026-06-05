import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";

export class OrganizationRepository {
  create(data: Prisma.OrganizationUncheckedCreateInput) {
    return prisma.organization.create({ data });
  }

  findMany(userId: string) {
    return prisma.organization.findMany({ where: { userId }, include: { repositories: true }, orderBy: { name: "asc" } });
  }

  findByIdForUser(id: string, userId: string) {
    return prisma.organization.findFirst({ where: { id, userId }, include: { repositories: true, activities: true } });
  }

  update(id: string, data: Prisma.OrganizationUncheckedUpdateInput) {
    return prisma.organization.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.organization.delete({ where: { id } });
  }
}
