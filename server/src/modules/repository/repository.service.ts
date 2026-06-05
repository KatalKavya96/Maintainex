import type { Prisma } from "@prisma/client";
import { ApiError } from "../../utils/ApiError";
import { RepositoryRepository } from "./repository.repository";

export class RepositoryService {
  constructor(private repository = new RepositoryRepository()) {}

  create(payload: Prisma.RepositoryUncheckedCreateInput) {
    return this.repository.create(payload);
  }

  list() {
    return this.repository.findMany();
  }

  async get(id: string) {
    const repo = await this.repository.findById(id);
    if (!repo) throw new ApiError(404, "Repository not found");
    return repo;
  }

  async update(id: string, payload: Prisma.RepositoryUncheckedUpdateInput) {
    await this.get(id);
    return this.repository.update(id, payload);
  }

  async delete(id: string) {
    await this.get(id);
    return this.repository.delete(id);
  }
}
