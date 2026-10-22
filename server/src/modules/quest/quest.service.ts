import { Prisma, type PrismaClient, type ScheduledWorkType } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { createQuest, questProgress, questQuery } from "./quest.validation";
import type { z } from "zod";

const include = {
  organization: { select: { id: true, name: true, slug: true, githubUrl: true, userId: true } },
  repository: { select: { id: true, name: true, fullName: true, githubUrl: true, isActive: true } }
} satisfies Prisma.QuestInclude;

const workTypes: Record<string, ScheduledWorkType> = { DOCUMENTATION: "DOCUMENTATION", BUG_FIX: "BUG_FIX", TESTING: "TESTING", FEATURE_BUILD: "FEATURE_BUILD", ISSUE_WORK: "ISSUE_WORK" };

export function webLink(value: string | null | undefined) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return ["https:", "http:"].includes(parsed.protocol) && !parsed.username && !parsed.password ? parsed.href : null;
  } catch { return null; }
}

export class QuestService {
  constructor(private db: PrismaClient = prisma) {}

  async authoringOptions(userId: string) {
    this.requireMember(userId);
    return this.db.organization.findMany({ where: { userId }, select: { id: true, name: true, repositories: { where: { userId, isActive: true }, select: { id: true, name: true } } }, orderBy: { name: "asc" } });
  }

  async create(userId: string, payload: z.infer<typeof createQuest>) {
    this.requireMember(userId);
    const quest = await this.db.$transaction(async (tx) => {
      const org = await tx.organization.findFirst({ where: { id: payload.organizationId, userId }, select: { id: true } });
      if (!org) throw new ApiError(403, "Choose one of your tracked organizations.");
      if (payload.repositoryId) {
        const repo = await tx.repository.findFirst({ where: { id: payload.repositoryId, userId, organizationId: org.id, isActive: true }, select: { id: true } });
        if (!repo) throw new ApiError(403, "Choose an active repository in this organization.");
      }
      return tx.quest.create({ data: { ...payload, repositoryId: payload.repositoryId ?? null } });
    });
    return this.detail(userId, quest.id);
  }

  async archive(userId: string, id: string) {
    this.requireMember(userId);
    const result = await this.db.quest.updateMany({ where: { id, organization: { userId } }, data: { isActive: false } });
    if (!result.count) throw new ApiError(404, "Quest not found in your tracked organizations.");
    return this.detail(userId, id);
  }

  async restore(userId: string, id: string) {
    this.requireMember(userId);
    const result = await this.db.quest.updateMany({ where: { id, organization: { userId } }, data: { isActive: true } });
    if (!result.count) throw new ApiError(404, "Quest not found in your tracked organizations.");
    return this.detail(userId, id);
  }

  async list(userId: string, query: z.infer<typeof questQuery>) {
    // Quests belong to the existing shared, authenticated Explore catalogue.
    // Enrollment, evidence and saved state are always restricted to the viewer.
    const where: Prisma.QuestWhereInput = {
      difficulty: query.difficulty ? { equals: query.difficulty, mode: "insensitive" } : undefined,
      OR: query.search ? [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { organization: { name: { contains: query.search, mode: "insensitive" } } },
        { repository: { name: { contains: query.search, mode: "insensitive" } } }
      ] : undefined
    };
    if (query.status === "started") where.userQuests = { some: { userId, status: { not: "COMPLETED" } } };
    else if (query.status === "completed") where.userQuests = { some: { userId, status: "COMPLETED" } };
    else if (query.status === "saved") where.savedOpportunities = { some: { userId, type: "QUEST" } };
    else if (query.status === "archived") { where.isActive = false; where.organization = { userId }; }
    else if (query.status === "available") {
      where.isActive = true;
      where.userQuests = { none: { userId } };
      where.AND = [{ OR: [{ repositoryId: null }, { repository: { isActive: true } }] }];
    } else where.AND = [{ OR: [{ isActive: true }, { userQuests: { some: { userId } } }] }];

    const [total, quests] = await this.db.$transaction([
      this.db.quest.count({ where }),
      this.db.quest.findMany({ where, include: { ...include, userQuests: { where: { userId }, include: { scheduledWork: true } }, savedOpportunities: { where: { userId, type: "QUEST" }, select: { id: true } } }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], skip: (query.page - 1) * query.limit, take: query.limit })
    ]);
    return { items: quests.map((quest) => this.map(quest, userId)), pagination: { page: query.page, limit: query.limit, total, totalPages: Math.max(1, Math.ceil(total / query.limit)) } };
  }

  async detail(userId: string, id: string) {
    const quest = await this.db.quest.findUnique({ where: { id }, include: { ...include, userQuests: { where: { userId }, include: { scheduledWork: true } }, savedOpportunities: { where: { userId, type: "QUEST" }, select: { id: true } } } });
    if (!quest) throw new ApiError(404, "Quest not found.");
    return this.map(quest, userId);
  }

  async start(userId: string, id: string) {
    this.requireMember(userId);
    // Serializable transactions plus the enrollment and work unique keys make
    // retries/concurrent Start requests return the same work item.
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        await this.db.$transaction(async (tx) => {
          const quest = await tx.quest.findUnique({ where: { id }, include });
          if (!quest) throw new ApiError(404, "Quest not found.");
          const existing = await tx.userQuest.findUnique({ where: { userId_questId: { userId, questId: id } } });
          if (existing?.scheduledWorkId) return;
          if (!quest.isActive || quest.repository?.isActive === false) throw new ApiError(409, "This quest is no longer available to start.");
          const enrollment = await tx.userQuest.upsert({ where: { userId_questId: { userId, questId: id } }, update: {}, create: { userId, questId: id } });
          const work = await tx.scheduledWork.upsert({
            where: { userId_source_externalId: { userId, source: "MANUAL", externalId: `quest:${id}` } },
            update: {},
            create: {
              userId, title: quest.title, type: workTypes[quest.type.toUpperCase().replace(/[\s-]+/g, "_")] ?? "ISSUE_WORK", status: enrollment.status === "COMPLETED" ? "DONE" : "IN_PROGRESS",
              organizationName: quest.organization.name, repositoryName: quest.repository?.name ?? "Organization contribution",
              context: quest.description, itemUrl: webLink(quest.sourceUrl) ?? webLink(quest.repository?.githubUrl) ?? webLink(quest.organization.githubUrl),
              source: "MANUAL", externalId: `quest:${id}`, tags: ["quest"], labels: [],
              difficulty: ["EASY", "MEDIUM", "HARD"].includes(quest.difficulty.toUpperCase()) ? quest.difficulty.toUpperCase() as "EASY" | "MEDIUM" | "HARD" : undefined,
              completedAt: enrollment.completedAt, startDate: new Date()
            }
          });
          await tx.userQuest.update({ where: { id: enrollment.id }, data: { scheduledWorkId: work.id } });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        return this.detail(userId, id);
      } catch (error) {
        const retryable = error instanceof Prisma.PrismaClientKnownRequestError && ["P2034", "P2002"].includes(error.code);
        if (!retryable) throw error;
        if (attempt === 3) throw new ApiError(409, "Another request is updating this quest. Refresh to continue or try again.");
      }
    }
    throw new ApiError(409, "Could not start the quest. Please try again.");
  }

  async progress(userId: string, id: string, payload: z.infer<typeof questProgress>) {
    this.requireMember(userId);
    await this.db.$transaction(async (tx) => {
      const enrollment = await tx.userQuest.findUnique({ where: { userId_questId: { userId, questId: id } }, include: { scheduledWork: true } });
      if (!enrollment) throw new ApiError(409, "Start the quest before updating progress.");
      if (!enrollment.scheduledWork || enrollment.scheduledWork.userId !== userId) throw new ApiError(409, "Restore the linked work item before updating progress.");
      const completedAt = payload.status === "COMPLETED" ? enrollment.completedAt ?? new Date() : null;
      const workStatus = payload.status === "COMPLETED" ? "DONE" : enrollment.status === "COMPLETED" || (payload.status === "SUBMITTED" && enrollment.status !== "SUBMITTED") ? "IN_PROGRESS" : enrollment.scheduledWork.status;
      await tx.userQuest.update({ where: { id: enrollment.id }, data: { status: payload.status, evidenceUrl: payload.evidenceUrl === undefined ? undefined : payload.evidenceUrl || null, completionNote: payload.completionNote, completedAt } });
      await tx.scheduledWork.update({ where: { id: enrollment.scheduledWork.id }, data: { status: workStatus, completedAt } });
      // Completion is self-reported. It never mints ScoreEvents or claims a merge.
    });
    return this.detail(userId, id);
  }

  private requireMember(userId: string) {
    if (userId === "viewer") throw new ApiError(401, "Sign in to start a quest and save your progress.");
  }

  private map(quest: Prisma.QuestGetPayload<{ include: typeof include }> & { userQuests: Array<Prisma.UserQuestGetPayload<{ include: { scheduledWork: true } }>>; savedOpportunities: Array<{ id: string }> }, userId: string) {
    const enrollment = quest.userQuests[0];
    return {
      id: quest.id, title: quest.title, description: quest.description, type: quest.type, difficulty: quest.difficulty, points: quest.points,
      isActive: quest.isActive && quest.repository?.isActive !== false, isArchived: !quest.isActive, sourceUrl: webLink(quest.sourceUrl), acceptanceCriteria: quest.acceptanceCriteria,
      organization: { id: quest.organization.id, name: quest.organization.name, slug: quest.organization.slug, githubUrl: webLink(quest.organization.githubUrl) }, canManage: quest.organization.userId === userId,
      repository: quest.repository ? { ...quest.repository, githubUrl: webLink(quest.repository.githubUrl) } : null,
      resourceUrl: webLink(quest.sourceUrl) ?? webLink(quest.repository?.githubUrl) ?? webLink(quest.organization.githubUrl),
      updatedAt: quest.updatedAt, isSaved: quest.savedOpportunities.length > 0,
      progress: enrollment ? {
        status: enrollment.status, completedAt: enrollment.completedAt, evidenceUrl: webLink(enrollment.evidenceUrl), completionNote: enrollment.completionNote,
        work: enrollment.scheduledWork ? { id: enrollment.scheduledWork.id, status: enrollment.scheduledWork.status, plan: enrollment.scheduledWork.plan, blockers: enrollment.scheduledWork.blockers, closingNotes: enrollment.scheduledWork.closingNotes } : null
      } : null
    };
  }
}
