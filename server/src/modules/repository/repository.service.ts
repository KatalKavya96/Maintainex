import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { RepositoryRepository } from "./repository.repository";

export class RepositoryService {
  constructor(private repository = new RepositoryRepository()) {}

  async create(userId: string, payload: Prisma.RepositoryUncheckedCreateInput) {
    await this.ensureOrganizationBelongsToUser(userId, payload.organizationId);
    return this.repository.create({ ...payload, userId });
  }

  list(userId: string) {
    return this.repository.findMany(userId);
  }

  async get(userId: string, id: string) {
    const repo = await this.repository.findByIdForUser(id, userId);
    if (!repo) throw new ApiError(404, "Repository not found");
    return repo;
  }

  async update(userId: string, id: string, payload: Prisma.RepositoryUncheckedUpdateInput) {
    await this.get(userId, id);
    if (typeof payload.organizationId === "string") await this.ensureOrganizationBelongsToUser(userId, payload.organizationId);
    const { userId: _ignored, ...safePayload } = payload;
    return this.repository.update(id, safePayload);
  }

  async delete(userId: string, id: string) {
    await this.get(userId, id);
    return this.repository.delete(id);
  }

  private async ensureOrganizationBelongsToUser(userId: string, organizationId: string) {
    const organization = await prisma.organization.findFirst({ where: { id: organizationId, userId }, select: { id: true } });
    if (!organization) throw new ApiError(400, "Organization does not belong to this user");
  }
}
