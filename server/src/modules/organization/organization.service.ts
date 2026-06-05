import type { Prisma } from "@prisma/client";
import { ApiError } from "../../utils/ApiError";
import { OrganizationRepository } from "./organization.repository";

export class OrganizationService {
  constructor(private repository = new OrganizationRepository()) {}

  create(userId: string, payload: Prisma.OrganizationUncheckedCreateInput) {
    return this.repository.create({ ...payload, userId });
  }

  list(userId: string) {
    return this.repository.findMany(userId);
  }

  async get(userId: string, id: string) {
    const organization = await this.repository.findByIdForUser(id, userId);
    if (!organization) throw new ApiError(404, "Organization not found");
    return organization;
  }

  async update(userId: string, id: string, payload: Prisma.OrganizationUncheckedUpdateInput) {
    await this.get(userId, id);
    const { userId: _ignored, ...safePayload } = payload;
    return this.repository.update(id, safePayload);
  }

  async delete(userId: string, id: string) {
    await this.get(userId, id);
    return this.repository.delete(id);
  }
}
