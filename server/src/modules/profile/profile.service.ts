import { ApiError } from "../../utils/ApiError";
import { ProfileRepository } from "./profile.repository";

export class ProfileService {
  constructor(private repository = new ProfileRepository()) {}

  async list() {
    return this.repository.findUsers();
  }

  async getProfile(userId: string) {
    const user = await this.repository.findUser(userId);
    if (!user) throw new ApiError(404, "Profile not found");

    const [activities, favoritePins, upcomingWork, [activityCount, organizationCount, repositoryCount, pinCount, scheduledWorkCount]] = await Promise.all([
      this.repository.activities(userId),
      this.repository.favoritePins(userId),
      this.repository.upcomingWork(userId),
      this.repository.counts(userId)
    ]);

    return {
      user,
      stats: {
        activities: activityCount,
        organizations: organizationCount,
        repositories: repositoryCount,
        pins: pinCount,
        scheduledWork: scheduledWorkCount
      },
      activities: activities.map((activity) => ({
        ...activity,
        organizationName: activity.organizationNameSnapshot,
        repositoryName: activity.repositoryNameSnapshot,
        number: activity.number ?? "",
        link: activity.link ?? "",
        description: activity.description ?? "",
        notes: activity.notes ?? "",
        tags: Array.isArray(activity.tags) ? activity.tags : []
      })),
      favoritePins: favoritePins.map((pin) => ({
        ...pin,
        description: pin.description ?? "",
        customCategory: pin.customCategory ?? "",
        iconUrl: pin.iconUrl ?? "",
        faviconUrl: pin.faviconUrl ?? "",
        imageUrl: pin.imageUrl ?? "",
        tags: Array.isArray(pin.tags) ? pin.tags : []
      })),
      upcomingWork: upcomingWork.map((work) => ({
        ...work,
        itemUrl: work.itemUrl ?? "",
        labels: Array.isArray(work.labels) ? work.labels : [],
        tags: Array.isArray(work.tags) ? work.tags : [],
        context: work.context ?? "",
        plan: work.plan ?? "",
        blockers: work.blockers ?? "",
        closingNotes: work.closingNotes ?? ""
      }))
    };
  }
}
