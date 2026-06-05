import type { PinCategory, Prisma } from "@prisma/client";
import { ApiError } from "../../utils/ApiError";
import { generateFaviconUrl, normalizeUrl } from "./pin.utils";
import { PinRepository } from "./pin.repository";

type PinPayload = {
  title?: string;
  url?: string;
  description?: string;
  category?: PinCategory;
  customCategory?: string;
  iconUrl?: string;
  faviconUrl?: string;
  imageUrl?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  tags?: string[];
  sortOrder?: number;
};

export class PinService {
  constructor(private repository = new PinRepository()) {}

  create(userId: string, payload: PinPayload) {
    return this.repository.create({
      ...this.toDatabasePayload(payload),
      userId,
      faviconUrl: payload.faviconUrl || generateFaviconUrl(payload.url ?? "")
    } as Prisma.PinUncheckedCreateInput);
  }

  async list(userId: string, query: Record<string, string | undefined>) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 48), 1), 100);
    const where: Prisma.PinWhereInput = {
      userId,
      category: query.category ? (query.category as PinCategory) : undefined,
      isFavorite: query.favorite ? query.favorite === "true" : undefined,
      isArchived: query.archived ? query.archived === "true" : false,
      tags: query.tag ? { array_contains: query.tag } : undefined,
      OR: query.search
        ? [
            { title: { contains: query.search, mode: "insensitive" } },
            { url: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
            { customCategory: { contains: query.search, mode: "insensitive" } }
          ]
        : undefined
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, this.getOrderBy(query.sort), (page - 1) * limit, limit),
      this.repository.count(where)
    ]);
    return { items, total, page, limit };
  }

  async get(userId: string, id: string) {
    const pin = await this.repository.findByIdForUser(id, userId);
    if (!pin) throw new ApiError(404, "Pin not found");
    return pin;
  }

  async update(userId: string, id: string, payload: PinPayload) {
    await this.get(userId, id);
    return this.repository.update(id, this.toDatabasePayload(payload) as Prisma.PinUncheckedUpdateInput);
  }

  async delete(userId: string, id: string) {
    await this.get(userId, id);
    return this.repository.delete(id);
  }

  async markOpened(userId: string, id: string) {
    await this.get(userId, id);
    return this.repository.update(id, { lastOpenedAt: new Date() });
  }

  async toggleFavorite(userId: string, id: string, isFavorite?: boolean) {
    const pin = await this.get(userId, id);
    return this.repository.update(id, { isFavorite: isFavorite ?? !pin.isFavorite });
  }

  reorder(userId: string, items: { id: string; sortOrder: number }[]) {
    return this.repository.updateManyForUser(userId, items);
  }

  private toDatabasePayload(payload: PinPayload) {
    const url = payload.url ? normalizeUrl(payload.url) : undefined;
    return {
      title: payload.title,
      url,
      description: payload.description || null,
      category: payload.category,
      customCategory: payload.customCategory || null,
      iconUrl: payload.iconUrl || null,
      faviconUrl: payload.faviconUrl || (url ? generateFaviconUrl(url) : undefined),
      imageUrl: payload.imageUrl || null,
      isFavorite: payload.isFavorite,
      isArchived: payload.isArchived,
      tags: payload.tags ?? undefined,
      sortOrder: payload.sortOrder
    };
  }

  private getOrderBy(sort?: string): Prisma.PinOrderByWithRelationInput[] {
    if (sort === "oldest") return [{ createdAt: "asc" }];
    if (sort === "favorite") return [{ isFavorite: "desc" }, { createdAt: "desc" }];
    if (sort === "title") return [{ title: "asc" }];
    if (sort === "lastOpened") return [{ lastOpenedAt: "desc" }, { createdAt: "desc" }];
    if (sort === "manual") return [{ sortOrder: "asc" }, { createdAt: "desc" }];
    return [{ createdAt: "desc" }];
  }
}
