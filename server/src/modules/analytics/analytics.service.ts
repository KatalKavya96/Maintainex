import { AnalyticsRepository } from "./analytics.repository";

export class AnalyticsService {
  constructor(private repository = new AnalyticsRepository()) {}

  async summary(userId: string) {
    const [activities, organizations, repositories, byType, byRepository, byOrganization] = await this.repository.summary(userId);
    return { activities, organizations, repositories, byType, byRepository, byOrganization };
  }

  daily(userId: string) {
    return this.repository.daily(userId);
  }

  weekly(userId: string) {
    return this.repository.daily(userId);
  }

  monthly(userId: string) {
    return this.repository.daily(userId);
  }

  yearly(userId: string) {
    return this.repository.daily(userId);
  }

  activityTypes(userId: string) {
    return this.repository.activityTypes(userId);
  }

  repositories(userId: string) {
    return this.repository.repositories(userId);
  }

  organizations(userId: string) {
    return this.repository.organizations(userId);
  }
}
