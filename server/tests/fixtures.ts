// Test-only records and adapter. Never imported by the production application.
import type { PrismaClient } from "@prisma/client";

export const fixtureUser = { id: "test-contributor", name: "Test Contributor", username: "test-contributor", email: "contributor@example.test", role: "VIEWER" };
export const fixtureOrganization = { id: "org-test", userId: fixtureUser.id, name: "Fixture Collective", slug: "fixture-collective", githubUrl: "https://github.com/example", description: "An isolated project for checking the contribution workflow.", category: "Developer Tools", logoUrl: null, techStack: ["TypeScript"], maintianexScore: 0, beginnerFriendlyScore: 0, reviewSpeedScore: 0, reputationScore: 0, activityScore: 0, programParticipations: [], activities: [], repositories: [], quests: [], updatedAt: new Date(), createdAt: new Date() };
export const fixtureRepository = { id: "repo-test", userId: fixtureUser.id, organizationId: fixtureOrganization.id, name: "contribution-guide", fullName: "example/contribution-guide", githubUrl: "https://github.com/example/contribution-guide", isActive: true, primaryLanguage: "TypeScript", description: "A test repository, used only by local automated and visual checks.", stars: 0, forks: 0, watchers: 0, openIssues: 0, techStack: ["TypeScript"], activities: [], quests: [], organization: fixtureOrganization };
export const fixtureQuest = { id: "quest-test", organizationId: fixtureOrganization.id, repositoryId: fixtureRepository.id, title: "Improve the first-contribution setup guide", description: "Help a new contributor set up the project. Identify missing prerequisites, clarify the local development steps, and explain how to run the checks before opening a pull request.", acceptanceCriteria: "Document the prerequisites. Follow the instructions from a clean checkout. Include the commands used to validate the guide.", sourceUrl: "https://github.com/example/contribution-guide/issues/1", type: "DOCUMENTATION", difficulty: "EASY", points: 0, isActive: true, organization: fixtureOrganization, repository: fixtureRepository, updatedAt: new Date(), createdAt: new Date() };

export function makeTestDatabase() {
  let sequence = 0;
  const state = { quests: [structuredClone(fixtureQuest)] as any[], enrollments: [] as any[], work: [] as any[], saved: [] as any[] };
  const calls: Array<{ model: string; method: string; args: any }> = [];
  const record = (model: string, method: string, args: any) => { calls.push({ model, method, args }); };
  const decorated = (quest: any, userId: string) => ({ ...quest, userQuests: state.enrollments.filter((x) => x.questId === quest.id && x.userId === userId).map((x) => ({ ...x, scheduledWork: state.work.find((w) => w.id === x.scheduledWorkId) ?? null })), savedOpportunities: state.saved.filter((x) => x.questId === quest.id && x.userId === userId) });
  const enrollmentKey = (args: any) => args.where.userId_questId;
  const update = (item: any, data: any) => { for (const [key, value] of Object.entries(data)) if (value !== undefined) item[key] = value; return { ...item }; };
  function matches(quest: any, where: any) {
    if (!where) return true;
    if (where.id && quest.id !== where.id) return false;
    if (where.isActive !== undefined && quest.isActive !== where.isActive) return false;
    if (where.difficulty && quest.difficulty.toLowerCase() !== where.difficulty.equals.toLowerCase()) return false;
    if (where.OR?.length) {
      const search = where.OR[0]?.title?.contains ?? where.OR[0]?.name?.contains;
      if (search && !`${quest.title} ${quest.description} ${quest.organization.name} ${quest.repository?.name}`.toLowerCase().includes(search.toLowerCase())) return false;
    }
    const filter = where.userQuests?.some;
    if (filter && !state.enrollments.some((x) => x.userId === filter.userId && x.questId === quest.id && (typeof filter.status === "string" ? x.status === filter.status : filter.status?.not ? x.status !== filter.status.not : true))) return false;
    if (where.userQuests?.none && state.enrollments.some((x) => x.questId === quest.id && x.userId === where.userQuests.none.userId)) return false;
    if (where.savedOpportunities?.some && !state.saved.some((x) => x.questId === quest.id && x.userId === where.savedOpportunities.some.userId)) return false;
    return true;
  }
  const db: any = {
    quest: {
      findUnique: async (args: any) => { record("quest", "findUnique", args); const q = state.quests.find((q) => q.id === args.where.id); return q ? args.include?.userQuests ? decorated(q, args.include.userQuests.where.userId) : { ...q } : null; },
      findMany: async (args: any) => { record("quest", "findMany", args); return state.quests.filter((q) => matches(q, args.where)).slice(args.skip ?? 0, (args.skip ?? 0) + (args.take ?? 100)).map((q) => args.include?.userQuests ? decorated(q, args.include.userQuests.where.userId) : q); },
      count: async (args: any) => { record("quest", "count", args); return state.quests.filter((q) => matches(q, args.where)).length; },
      create: async ({ data }: any) => { const q = { ...structuredClone(fixtureQuest), ...data, id: `quest-${++sequence}` }; state.quests.push(q); return q; },
      updateMany: async (args: any) => { record("quest", "updateMany", args); const q = state.quests.find((q) => q.id === args.where.id && q.organization.userId === args.where.organization.userId); if (!q) return { count: 0 }; update(q, args.data); return { count: 1 }; }
    },
    userQuest: {
      findUnique: async (args: any) => { record("userQuest", "findUnique", args); const key = enrollmentKey(args); const x = state.enrollments.find((x) => x.userId === key.userId && x.questId === key.questId); return x ? { ...x, scheduledWork: state.work.find((w) => w.id === x.scheduledWorkId) ?? null } : null; },
      upsert: async (args: any) => { const key = enrollmentKey(args); let x = state.enrollments.find((x) => x.userId === key.userId && x.questId === key.questId); if (!x) { x = { id: `enrollment-${++sequence}`, status: "STARTED", scheduledWorkId: null, evidenceUrl: null, completionNote: null, completedAt: null, ...args.create }; state.enrollments.push(x); } return { ...x }; },
      update: async (args: any) => { const x = state.enrollments.find((x) => x.id === args.where.id); return update(x, args.data); },
      updateMany: async (args: any) => { const items = state.enrollments.filter((x) => x.scheduledWorkId === args.where.scheduledWorkId && x.userId === args.where.userId && (!args.where.status || x.status === args.where.status)); items.forEach((x) => update(x, args.data)); return { count: items.length }; }
    },
    scheduledWork: {
      findFirst: async (args: any) => { const work = state.work.find((x) => x.id === args.where.id && x.userId === args.where.userId); const enrollment = state.enrollments.find((x) => x.scheduledWorkId === work?.id); return work ? { ...work, userQuest: enrollment ? { questId: enrollment.questId } : null } : null; },
      upsert: async (args: any) => { const key = args.where.userId_source_externalId; let work = state.work.find((x) => x.userId === key.userId && x.source === key.source && x.externalId === key.externalId); if (!work) { work = { id: `work-${++sequence}`, plan: null, blockers: null, closingNotes: null, completedAt: null, createdAt: new Date(), updatedAt: new Date(), ...args.create }; state.work.push(work); } return { ...work }; },
      update: async (args: any) => { const work = state.work.find((x) => x.id === args.where.id); if (!work) throw new Error("Missing work"); return update(work, args.data); },
      count: async (args: any) => { record("scheduledWork", "count", args); return state.work.filter((x) => x.userId === args.where.userId).length; },
      findMany: async (args: any) => { record("scheduledWork", "findMany", args); return state.work.filter((x) => x.userId === args.where.userId).slice(0, args.take ?? 100); }
    },
    organization: {
      findFirst: async (args: any) => args.where.id === fixtureOrganization.id && args.where.userId === fixtureUser.id ? fixtureOrganization : null,
      count: async (args: any) => { record("organization", "count", args); return 1; },
      findMany: async (args: any) => { record("organization", "findMany", args); return args.take === 0 ? [] : [{ ...fixtureOrganization, repositories: [fixtureRepository] }]; }
    },
    repository: {
      findFirst: async (args: any) => args.where.id === fixtureRepository.id && args.where.userId === fixtureUser.id && args.where.organizationId === fixtureOrganization.id ? fixtureRepository : null,
      count: async (args: any) => { record("repository", "count", args); return 1; },
      findMany: async (args: any) => { record("repository", "findMany", args); return args.take === 0 ? [] : [fixtureRepository]; }
    },
    user: { count: async (args: any) => { record("user", "count", args); return 1; }, findMany: async (args: any) => { record("user", "findMany", args); return args.take === 0 ? [] : [fixtureUser]; } },
    pin: { count: async (args: any) => { record("pin", "count", args); return 0; }, findMany: async (args: any) => { record("pin", "findMany", args); return []; } }
  };
  let queue = Promise.resolve();
  db.$transaction = (operation: any) => {
    if (Array.isArray(operation)) return Promise.all(operation);
    // Serialize the in-memory adapter; production uses database SERIALIZABLE.
    const result = queue.then(() => operation(db));
    queue = result.catch(() => undefined);
    return result;
  };
  return { db: db as PrismaClient, state, calls };
}
