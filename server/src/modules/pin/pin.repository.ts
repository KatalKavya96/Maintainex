import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";

export class PinRepository {
  create(data: Prisma.PinUncheckedCreateInput) {
    return prisma.pin.create({ data });
  }

  findMany(where: Prisma.PinWhereInput, orderBy: Prisma.PinOrderByWithRelationInput[], skip: number, take: number) {
    return prisma.pin.findMany({ where, orderBy, skip, take });
  }

  count(where: Prisma.PinWhereInput) {
    return prisma.pin.count({ where });
  }

  findByIdForUser(id: string, userId: string) {
    return prisma.pin.findFirst({ where: { id, userId } });
  }

  update(id: string, data: Prisma.PinUncheckedUpdateInput) {
    return prisma.pin.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.pin.delete({ where: { id } });
  }

  updateManyForUser(userId: string, items: { id: string; sortOrder: number }[]) {
    return prisma.$transaction(items.map((item) => prisma.pin.updateMany({ where: { id: item.id, userId }, data: { sortOrder: item.sortOrder } })));
  }
}
