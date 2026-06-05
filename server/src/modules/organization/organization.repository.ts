import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";

export class OrganizationRepository {
  create(data: Prisma.OrganizationCreateInput) {
    return prisma.organization.create({ data });
  }

  findMany() {
    return prisma.organization.findMany({ include: { repositories: true }, orderBy: { name: "asc" } });
  }

  findById(id: string) {
    return prisma.organization.findUnique({ where: { id }, include: { repositories: true, activities: true } });
  }

  update(id: string, data: Prisma.OrganizationUpdateInput) {
    return prisma.organization.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.organization.delete({ where: { id } });
  }
}
