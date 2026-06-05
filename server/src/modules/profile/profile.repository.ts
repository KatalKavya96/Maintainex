import { prisma } from "../../config/database";

export class ProfileRepository {
  findUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            activities: true,
            organizations: true,
            repositories: true,
            pins: true,
            scheduledWork: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  findUser(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
  }

  activities(userId: string) {
    return prisma.activity.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 1000,
      include: { organization: true, repository: true }
    });
  }

  favoritePins(userId: string) {
    return prisma.pin.findMany({
      where: { userId, isFavorite: true, isArchived: false },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 10
    });
  }

  upcomingWork(userId: string) {
    return prisma.scheduledWork.findMany({
      where: { userId },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 10
    });
  }

  counts(userId: string) {
    return Promise.all([
      prisma.activity.count({ where: { userId } }),
      prisma.organization.count({ where: { userId } }),
      prisma.repository.count({ where: { userId } }),
      prisma.pin.count({ where: { userId, isArchived: false } }),
      prisma.scheduledWork.count({ where: { userId } })
    ]);
  }
}
