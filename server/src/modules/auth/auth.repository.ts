import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";

export class AuthRepository {
  countUsers() {
    return prisma.user.count();
  }

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username } });
  }

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  }
}
