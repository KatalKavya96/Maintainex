import type { AuthProvider, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../../config/database";

export type LinkedAccount = {
  provider: AuthProvider;
  providerAccountId: string;
  providerEmail?: string | null;
  accessTokenEncrypted: string;
  refreshTokenEncrypted?: string;
  expiresAt?: Date;
  scope?: string | null;
  tokenType?: string | null;
  profile?: Prisma.InputJsonObject;
};

export type GithubLink = { githubUserId: string; login: string; accessTokenEncrypted: string; scope?: string | null; tokenType?: string | null };

export class AuthRepository {
  constructor(private db: PrismaClient = prisma) {}

  countUsers() {
    return this.db.user.count();
  }

  findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.db.user.findUnique({ where: { id } });
  }

  findByUsername(username: string) {
    return this.db.user.findUnique({ where: { username } });
  }

  create(data: Prisma.UserCreateInput) {
    return this.db.user.create({ data });
  }

  updateUser(id: string, data: Prisma.UserUpdateInput) {
    return this.db.user.update({ where: { id }, data });
  }

  findAccount(provider: AuthProvider, providerAccountId: string) {
    return this.db.authAccount.findUnique({ where: { provider_providerAccountId: { provider, providerAccountId } } });
  }

  findUserAccount(userId: string, provider: AuthProvider) {
    return this.db.authAccount.findUnique({ where: { userId_provider: { userId, provider } } });
  }

  /** A GitHub identity may be known through login, a Settings connection, or the profile field. */
  async findUserIdByGithubId(githubUserId: string) {
    const [account, integration, user] = await Promise.all([
      this.findAccount("GITHUB", githubUserId),
      this.db.gitHubIntegration.findUnique({ where: { githubUserId }, select: { userId: true } }),
      this.db.user.findUnique({ where: { githubId: githubUserId }, select: { id: true } })
    ]);
    return account?.userId ?? integration?.userId ?? user?.id ?? null;
  }

  upsertAccount(userId: string, account: LinkedAccount) {
    const data = { ...account, providerAccountId: account.providerAccountId };
    return this.db.authAccount.upsert({ where: { userId_provider: { userId, provider: account.provider } }, update: data, create: { userId, ...data } });
  }

  upsertGithubIntegration(userId: string, link: GithubLink) {
    const reset = { needsReconnect: false, lastSyncError: null };
    return this.db.gitHubIntegration.upsert({ where: { userId }, update: { ...link, ...reset }, create: { userId, ...link } });
  }
}
