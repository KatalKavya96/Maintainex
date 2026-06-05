import type { Prisma } from "@prisma/client";
import { ApiError } from "../../utils/ApiError";
import { OrganizationRepository } from "./organization.repository";

export class OrganizationService {
  constructor(private repository = new OrganizationRepository()) {}

  create(payload: Prisma.OrganizationCreateInput) {
    return this.repository.create(payload);
  }

  list() {
    return this.repository.findMany();
  }

  async get(id: string) {
    const organization = await this.repository.findById(id);
    if (!organization) throw new ApiError(404, "Organization not found");
    return organization;
  }

  async update(id: string, payload: Prisma.OrganizationUpdateInput) {
    await this.get(id);
    return this.repository.update(id, payload);
  }

  async delete(id: string) {
    await this.get(id);
    return this.repository.delete(id);
  }
}
