import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../../config/database";
import { emitDashboardUpdate } from "../../realtime/socket";
import { ApiError } from "../../utils/ApiError";
import { EmailService } from "../../utils/email.service";
import { ensureUsableEmail } from "../../utils/emailValidation";
import { ProfileRepository } from "./profile.repository";

type UpdateProfilePayload = {
  name?: string;
  username?: string;
  bio?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  xUrl?: string | null;
  leetcodeUrl?: string | null;
  portfolioUrl?: string | null;
  skills?: string[];
  mainOrganizations?: string[];
};

const usernamePattern = /^[a-z0-9](?:[a-z0-9-]{1,37}[a-z0-9])$/;

const cleanString = (value?: string | null) => {
  const next = value?.trim();
  return next ? next : null;
};

const normalizeUsername = (username: string) =>
  username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const nextUsernameChangeDate = (date: Date) => {
  const next = new Date(date);
  next.setDate(next.getDate() + 30);
  return next;
};

export class ProfileService {
  constructor(
    private repository = new ProfileRepository(),
    private emailService = new EmailService()
  ) {}

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

  async usernameAvailability(currentUserId: string, username: string) {
    const normalized = normalizeUsername(username);
    if (!usernamePattern.test(normalized)) {
      return {
        username: normalized,
        available: false,
        canChange: false,
        message: "Use 3-39 lowercase letters, numbers, or hyphens. Start and end with a letter or number."
      };
    }

    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId }, select: { id: true, username: true, usernameUpdatedAt: true } });
    if (!currentUser) throw new ApiError(404, "User not found");

    const existing = await prisma.user.findUnique({ where: { username: normalized }, select: { id: true } });
    const available = !existing || existing.id === currentUserId;
    const nextChangeAt = currentUser.usernameUpdatedAt ? nextUsernameChangeDate(currentUser.usernameUpdatedAt) : null;
    const canChange = !nextChangeAt || nextChangeAt <= new Date() || normalized === currentUser.username;

    return {
      username: normalized,
      available,
      canChange,
      nextChangeAt,
      message: !available
        ? "That username is already taken."
        : !canChange
          ? `You can change your username again on ${nextChangeAt?.toISOString().slice(0, 10)}.`
          : normalized === currentUser.username
            ? "This is your current username."
            : "That username is available."
    };
  }

  async updateCurrentProfile(userId: string, payload: UpdateProfilePayload) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, usernameUpdatedAt: true }
    });
    if (!currentUser) throw new ApiError(404, "User not found");

    const data: Record<string, unknown> = {};
    if (payload.name !== undefined) data.name = payload.name.trim();
    if (payload.bio !== undefined) data.bio = cleanString(payload.bio);
    if (payload.githubUrl !== undefined) data.githubUrl = cleanString(payload.githubUrl);
    if (payload.linkedinUrl !== undefined) data.linkedinUrl = cleanString(payload.linkedinUrl);
    if (payload.xUrl !== undefined) data.xUrl = cleanString(payload.xUrl);
    if (payload.leetcodeUrl !== undefined) data.leetcodeUrl = cleanString(payload.leetcodeUrl);
    if (payload.portfolioUrl !== undefined) data.portfolioUrl = cleanString(payload.portfolioUrl);
    if (payload.skills !== undefined) data.skills = payload.skills.map((item) => item.trim()).filter(Boolean);
    if (payload.mainOrganizations !== undefined) data.mainOrganizations = payload.mainOrganizations.map((item) => item.trim()).filter(Boolean);

    if (payload.username !== undefined) {
      const normalized = normalizeUsername(payload.username);
      if (!usernamePattern.test(normalized)) throw new ApiError(400, "Invalid username format");
      if (normalized !== currentUser.username) {
        const availability = await this.usernameAvailability(userId, normalized);
        if (!availability.available) throw new ApiError(409, "Username already exists");
        if (!availability.canChange) throw new ApiError(429, availability.message);
        data.username = normalized;
        data.usernameUpdatedAt = new Date();
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        emailVerifiedAt: true,
        role: true,
        bio: true,
        githubUrl: true,
        linkedinUrl: true,
        xUrl: true,
        leetcodeUrl: true,
        portfolioUrl: true,
        usernameUpdatedAt: true,
        skills: true,
        mainOrganizations: true,
        createdAt: true
      }
    });

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true, passwordSetAt: true } });
    if (!user) throw new ApiError(404, "User not found");
    if (!user.passwordSetAt) throw new ApiError(400, "This account does not have a password yet. Use provider login for now.");

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new ApiError(401, "Current password is incorrect");

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash, passwordSetAt: new Date() } });
    return { changed: true };
  }

  async sendEmailVerificationOtp(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerifiedAt: true } });
    if (!user) throw new ApiError(404, "User not found");
    if (user.emailVerifiedAt) return { sent: false, alreadyVerified: true, message: "Your email is already verified." };
    await ensureUsableEmail(user.email);

    const recent = await prisma.emailVerificationOtp.findFirst({
      where: { userId, consumedAt: null, createdAt: { gt: new Date(Date.now() - 60 * 1000) } },
      orderBy: { createdAt: "desc" }
    });
    if (recent) throw new ApiError(429, "A verification code was sent recently. Please wait a minute before requesting another.");

    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, 12);
    await prisma.emailVerificationOtp.create({
      data: {
        userId,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });
    await this.emailService.sendOtp(user.email, code);
    return { sent: true, alreadyVerified: false, message: `Verification code sent to ${user.email}.` };
  }

  async verifyEmailOtp(userId: string, code: string) {
    const otp = await prisma.emailVerificationOtp.findFirst({
      where: { userId, consumedAt: null },
      orderBy: { createdAt: "desc" }
    });
    if (!otp) throw new ApiError(400, "Request a verification code first.");
    if (otp.expiresAt < new Date()) throw new ApiError(400, "This verification code has expired. Request a new one.");
    if (otp.attemptCount >= 5) throw new ApiError(429, "Too many incorrect attempts. Request a new code.");

    const valid = await bcrypt.compare(code, otp.codeHash);
    if (!valid) {
      await prisma.emailVerificationOtp.update({ where: { id: otp.id }, data: { attemptCount: { increment: 1 } } });
      throw new ApiError(400, "Incorrect verification code.");
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationOtps: {
          update: {
            where: { id: otp.id },
            data: { consumedAt: new Date() }
          }
        }
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        emailVerifiedAt: true,
        role: true
      }
    });

    return { verified: true, user };
  }

  async resetWorkspace(userId: string, password?: string) {
    if (!password) throw new ApiError(400, "Password is required");

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
    if (!user) throw new ApiError(404, "User not found");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new ApiError(401, "Invalid password");

    const [notifications, goals, scheduledWork, pins, activities, repositories, organizations] = await prisma.$transaction([
      prisma.notification.deleteMany({ where: { recipientId: userId } }),
      prisma.goal.deleteMany({ where: { userId } }),
      prisma.scheduledWork.deleteMany({ where: { userId } }),
      prisma.pin.deleteMany({ where: { userId } }),
      prisma.activity.deleteMany({ where: { userId } }),
      prisma.repository.deleteMany({ where: { userId } }),
      prisma.organization.deleteMany({ where: { userId } })
    ]);

    emitDashboardUpdate(userId);

    return {
      notifications: notifications.count,
      goals: goals.count,
      scheduledWork: scheduledWork.count,
      pins: pins.count,
      activities: activities.count,
      repositories: repositories.count,
      organizations: organizations.count
    };
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
