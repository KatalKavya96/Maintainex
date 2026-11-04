import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { Prisma, User, UserRole } from "@prisma/client";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { encryptToken } from "../../utils/tokenCrypto";
import { AuthRepository } from "./auth.repository";
import type { OAuthProfile } from "./oauth-providers";
import { uniqueUsername } from "./username";

export type GithubConnection = { githubUserId: string; login: string; accessToken: string; scope?: string; tokenType?: string; htmlUrl?: string; avatarUrl?: string };

const providerName = (provider: OAuthProfile["provider"]) => (provider === "GOOGLE" ? "Google" : "GitHub");

/** Decides which Maintainex user a provider identity belongs to, without letting an unproven email claim an account. */
export class OAuthAccounts {
  constructor(private repository = new AuthRepository()) {}

  async resolveLogin(profile: OAuthProfile): Promise<User> {
    if (!profile.emailVerified) throw new ApiError(400, `${providerName(profile.provider)} did not confirm your email address.`);

    let userId = (await this.repository.findAccount(profile.provider, profile.providerAccountId))?.userId ?? null;
    if (!userId && profile.provider === "GITHUB") userId = await this.repository.findUserIdByGithubId(profile.providerAccountId);

    let user = userId ? await this.repository.findById(userId) : null;
    if (!user) {
      const existing = await this.repository.findByEmail(profile.email);
      if (existing?.passwordSetAt && !existing.emailVerifiedAt) {
        // The password account never proved it owns this email, so linking would hand it to whoever created it.
        throw new ApiError(409, `An account with this email already exists. Sign in with your password, then connect ${providerName(profile.provider)} from Settings.`);
      }
      user = existing ?? (await this.createUser(profile));
    }

    const current = await this.repository.findUserAccount(user.id, profile.provider);
    if (current && current.providerAccountId !== profile.providerAccountId) {
      throw new ApiError(409, `This Maintainex account is already linked to a different ${providerName(profile.provider)} account.`);
    }

    await this.repository.upsertAccount(user.id, {
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
      providerEmail: profile.email,
      accessTokenEncrypted: encryptToken(profile.accessToken),
      refreshTokenEncrypted: profile.refreshToken ? encryptToken(profile.refreshToken) : undefined,
      expiresAt: profile.expiresAt,
      scope: profile.scope,
      tokenType: profile.tokenType,
      profile: profile.rawProfile as Prisma.InputJsonObject
    });
    const updates: Prisma.UserUpdateInput = {};
    if (!user.emailVerifiedAt && user.email === profile.email) updates.emailVerifiedAt = new Date();
    if (!user.avatarUrl && profile.avatarUrl) updates.avatarUrl = profile.avatarUrl;
    if (Object.keys(updates).length) await this.repository.updateUser(user.id, updates);
    if (profile.provider === "GITHUB" && profile.githubLogin) {
      await this.linkGithub(user.id, { githubUserId: profile.providerAccountId, login: profile.githubLogin, accessToken: profile.accessToken, scope: profile.scope, tokenType: profile.tokenType, htmlUrl: profile.githubUrl, avatarUrl: profile.avatarUrl });
    }
    return (await this.repository.findById(user.id))!;
  }

  /** Settings → Connect GitHub for a signed-in user; also enables "Sign in with GitHub" for them. */
  async connectGithub(userId: string, connection: GithubConnection) {
    const owner = await this.repository.findUserIdByGithubId(connection.githubUserId);
    if (owner && owner !== userId) {
      throw new ApiError(409, `GitHub account @${connection.login} is already connected to another Maintainex account. Disconnect it there first.`);
    }
    await this.repository.upsertAccount(userId, {
      provider: "GITHUB",
      providerAccountId: connection.githubUserId,
      accessTokenEncrypted: encryptToken(connection.accessToken),
      scope: connection.scope,
      tokenType: connection.tokenType,
      profile: { id: connection.githubUserId, login: connection.login }
    });
    await this.linkGithub(userId, connection);
    return { connected: true, login: connection.login };
  }

  private async linkGithub(userId: string, connection: GithubConnection) {
    await this.repository.upsertGithubIntegration(userId, {
      githubUserId: connection.githubUserId,
      login: connection.login,
      accessTokenEncrypted: encryptToken(connection.accessToken),
      scope: connection.scope,
      tokenType: connection.tokenType
    });
    await this.repository.updateUser(userId, {
      githubId: connection.githubUserId,
      githubUsername: connection.login,
      ...(connection.htmlUrl ? { githubUrl: connection.htmlUrl } : {}),
      ...(connection.avatarUrl ? { avatarUrl: connection.avatarUrl } : {})
    });
  }

  private async createUser(profile: OAuthProfile) {
    // With an invitation code configured, only the code grants ADMIN; providers never do.
    const role: UserRole = !env.signupAdminCode && (await this.repository.countUsers()) === 0 ? "ADMIN" : "VIEWER";
    return this.repository.create({
      name: profile.name,
      username: await uniqueUsername(profile.usernameSeed, profile.email, (name) => this.repository.findByUsername(name)),
      email: profile.email,
      passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12),
      passwordSetAt: null,
      emailVerifiedAt: new Date(),
      role,
      avatarUrl: profile.avatarUrl
    });
  }
}
