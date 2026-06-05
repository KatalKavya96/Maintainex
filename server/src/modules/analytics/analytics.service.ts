import { AnalyticsRepository } from "./analytics.repository";

export class AnalyticsService {
  constructor(private repository = new AnalyticsRepository()) {}

  async summary() {
    const [activities, organizations, repositories, byType, byRepository, byOrganization] = await this.repository.summary();
    return { activities, organizations, repositories, byType, byRepository, byOrganization };
  }

  daily() {
    return this.repository.daily();
  }

  weekly() {
    return this.repository.daily();
  }

  monthly() {
    return this.repository.daily();
  }

  yearly() {
    return this.repository.daily();
  }

  activityTypes() {
    return this.repository.activityTypes();
  }

  repositories() {
    return this.repository.repositories();
  }

  organizations() {
    return this.repository.organizations();
  }
}
