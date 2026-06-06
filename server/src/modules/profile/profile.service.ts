import { ApiError } from "../../utils/ApiError";
import { ProfileRepository } from "./profile.repository";

export class ProfileService {
  constructor(private repository = new ProfileRepository()) {}

  async list() {
    return this.repository.findUsers();
  }

  async getProfile(userId: string, viewerId?: string) {
    const user = await this.repository.findUser(userId);
    if (!user) throw new ApiError(404, "Profile not found");
    return this.profileForUser(user, viewerId);
  }

  async getProfileByUsername(username: string, viewerId?: string) {
    const user = await this.repository.findUserByUsername(username);
    if (!user) throw new ApiError(404, "Profile not found");
    return this.profileForUser(user, viewerId);
  }

  private async profileForUser(user: NonNullable<Awaited<ReturnType<ProfileRepository["findUser"]>>>, viewerId?: string) {
    const [activities, favoritePins, upcomingWork, [activityCount, organizationCount, repositoryCount, pinCount, scheduledWorkCount], [followers, following], follow] = await Promise.all([
      this.repository.activities(user.id),
      this.repository.favoritePins(user.id),
      this.repository.upcomingWork(user.id),
      this.repository.counts(user.id),
      this.repository.followCounts(user.id),
      viewerId && viewerId !== user.id ? this.repository.isFollowing(viewerId, user.id) : Promise.resolve(null)
    ]);

    return {
      user,
      stats: {
        activities: activityCount,
        organizations: organizationCount,
        repositories: repositoryCount,
        pins: pinCount,
        scheduledWork: scheduledWorkCount,
        followers,
        following,
        isFollowing: Boolean(follow)
      },
      activities: activities.map((activity) => ({
        ...activity,
        date: activity.date.toISOString().slice(0, 10),
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
