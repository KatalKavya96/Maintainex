import { prisma } from "../../config/database";

export class AnalyticsRepository {
  summary() {
    return Promise.all([
      prisma.activity.count(),
      prisma.organization.count(),
      prisma.repository.count(),
      prisma.activity.groupBy({ by: ["activityType"], _count: { _all: true } }),
      prisma.activity.groupBy({ by: ["repositoryNameSnapshot"], _count: { _all: true } }),
      prisma.activity.groupBy({ by: ["organizationNameSnapshot"], _count: { _all: true } })
    ]);
  }

  daily() {
    return prisma.activity.groupBy({ by: ["date"], _count: { _all: true }, orderBy: { date: "asc" } });
  }

  activityTypes() {
    return prisma.activity.groupBy({ by: ["activityType"], _count: { _all: true } });
  }

  repositories() {
    return prisma.activity.groupBy({ by: ["repositoryNameSnapshot"], _count: { _all: true } });
  }

  organizations() {
    return prisma.activity.groupBy({ by: ["organizationNameSnapshot"], _count: { _all: true } });
  }
}
