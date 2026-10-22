export const searchKinds = ["organizations", "repositories", "quests", "people", "work", "pins"] as const;
export type SearchKind = typeof searchKinds[number];
export const searchLabels: Record<SearchKind, string> = { organizations: "Organizations", repositories: "Repositories", quests: "Quests", people: "People", work: "Your work", pins: "Your pins" };
export type SearchResult = { id: string; kind: SearchKind; title: string; subtitle: string; href: string };
export type SearchResponse = { items: SearchResult[]; counts: Record<SearchKind, number>; limit: number };

// Keep unfinished quest discovery out of the current frontend.
export const availableSearchKinds = searchKinds.filter((kind) => kind !== "quests");
