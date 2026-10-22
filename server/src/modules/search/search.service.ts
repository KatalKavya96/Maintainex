import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../config/database";
import { z } from "zod";

export const searchQuery = z.object({
  q: z.string().trim().min(2, "Enter at least two characters.").max(120),
  kind: z.enum(["all", "organizations", "repositories", "quests", "people", "work", "pins"]).default("all"),
  limit: z.coerce.number().int().min(1).max(30).default(6)
});
type Kind = Exclude<z.infer<typeof searchQuery>["kind"], "all">;
type Result = { id: string; kind: Kind; title: string; subtitle: string; href: string };

export class SearchService {
  constructor(private db: PrismaClient = prisma) {}

  async search(userId: string, input: z.infer<typeof searchQuery>) {
    const contains = { contains: input.q, mode: "insensitive" as const };
    const take = input.limit;
    const orgWhere = { OR: [{ name: contains }, { description: contains }, { category: contains }] };
    const repoWhere = { OR: [{ name: contains }, { fullName: contains }, { description: contains }, { primaryLanguage: contains }] };
    const questWhere = { AND: [{ OR: [{ isActive: true }, { userQuests: { some: { userId } } }] }, { OR: [{ title: contains }, { description: contains }, { organization: { name: contains } }, { repository: { name: contains } }] }] };
    const peopleWhere = { OR: [{ name: contains }, { username: contains }, { bio: contains }] };
    const workWhere = { userId, OR: [{ title: contains }, { repositoryName: contains }, { organizationName: contains }] };
    const pinWhere = { userId, isArchived: false, OR: [{ title: contains }, { description: contains }] };
    const wants = (kind: Kind) => input.kind === "all" || input.kind === kind;
    const [orgCount, repoCount, questCount, peopleCount, workCount, pinCount, orgs, repos, quests, people, work, pins] = await this.db.$transaction([
      this.db.organization.count({ where: orgWhere }), this.db.repository.count({ where: repoWhere }), this.db.quest.count({ where: questWhere }),
      this.db.user.count({ where: peopleWhere }), this.db.scheduledWork.count({ where: workWhere }), this.db.pin.count({ where: pinWhere }),
      this.db.organization.findMany({ where: orgWhere, select: { id: true, name: true, slug: true, category: true }, orderBy: { name: "asc" }, take: wants("organizations") ? take : 0 }),
      this.db.repository.findMany({ where: repoWhere, select: { id: true, name: true, fullName: true, primaryLanguage: true, organization: { select: { name: true } } }, orderBy: [{ name: "asc" }, { id: "asc" }], take: wants("repositories") ? take : 0 }),
      this.db.quest.findMany({ where: questWhere, select: { id: true, title: true, difficulty: true, organization: { select: { name: true } } }, orderBy: [{ title: "asc" }, { id: "asc" }], take: wants("quests") ? take : 0 }),
      this.db.user.findMany({ where: peopleWhere, select: { id: true, name: true, username: true }, orderBy: { username: "asc" }, take: wants("people") ? take : 0 }),
      this.db.scheduledWork.findMany({ where: workWhere, select: { id: true, title: true, repositoryName: true, status: true }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: wants("work") ? take : 0 }),
      this.db.pin.findMany({ where: pinWhere, select: { id: true, title: true, category: true }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: wants("pins") ? take : 0 })
    ]);
    const items: Result[] = [
      ...orgs.map((x): Result => ({ id: x.id, kind: "organizations", title: x.name, subtitle: x.category ?? "Organization", href: `/explore/organizations/${encodeURIComponent(x.slug || x.id)}` })),
      ...repos.map((x): Result => ({ id: x.id, kind: "repositories", title: x.fullName || `${x.organization.name}/${x.name}`, subtitle: x.primaryLanguage ?? "Repository", href: `/repos/${encodeURIComponent(x.organization.name)}/${encodeURIComponent(x.name)}` })),
      ...quests.map((x): Result => ({ id: x.id, kind: "quests", title: x.title, subtitle: `${x.organization.name} · ${x.difficulty}`, href: `/explore/quests/${encodeURIComponent(x.id)}` })),
      ...people.map((x): Result => ({ id: x.id, kind: "people", title: x.name, subtitle: `@${x.username}`, href: `/profile/${encodeURIComponent(x.username)}` })),
      ...work.map((x): Result => ({ id: x.id, kind: "work", title: x.title, subtitle: `${x.repositoryName} · ${x.status.replaceAll("_", " ").toLowerCase()}`, href: `/schedule/${encodeURIComponent(x.id)}` })),
      ...pins.map((x): Result => ({ id: x.id, kind: "pins", title: x.title, subtitle: x.category, href: `/pins/${encodeURIComponent(x.id)}` }))
    ];
    return { items, counts: { organizations: orgCount, repositories: repoCount, quests: questCount, people: peopleCount, work: workCount, pins: pinCount }, limit: take };
  }
}
