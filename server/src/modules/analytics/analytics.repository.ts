import { prisma } from "../../config/database";

export class AnalyticsRepository {
  summary(userId: string) {
    return Promise.all([
      prisma.activity.count({ where: { userId } }),
      prisma.organization.count({ where: { userId } }),
      prisma.repository.count({ where: { userId } }),
      prisma.activity.groupBy({ by: ["activityType"], where: { userId }, _count: { _all: true } }),
      prisma.activity.groupBy({ by: ["repositoryNameSnapshot"], where: { userId }, _count: { _all: true } }),
      prisma.activity.groupBy({ by: ["organizationNameSnapshot"], where: { userId }, _count: { _all: true } })
    ]);
  }

  daily(userId: string) {
    return prisma.activity.groupBy({ by: ["date"], where: { userId }, _count: { _all: true }, orderBy: { date: "asc" } });
  }

  activityTypes(userId: string) {
    return prisma.activity.groupBy({ by: ["activityType"], where: { userId }, _count: { _all: true } });
  }

  repositories(userId: string) {
    return prisma.activity.groupBy({ by: ["repositoryNameSnapshot"], where: { userId }, _count: { _all: true } });
  }

  organizations(userId: string) {
    return prisma.activity.groupBy({ by: ["organizationNameSnapshot"], where: { userId }, _count: { _all: true } });
  }
}
