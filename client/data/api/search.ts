import { apiRequest, queryString } from "../http";
import type { SearchResponse } from "@/types/search";

export const searchWorkspace = async (q: string, kind = "all", limit = 6, signal?: AbortSignal): Promise<SearchResponse> => {
  const result = await apiRequest<SearchResponse>(`/search${queryString({ q, kind, limit })}`, { signal });
  return { ...result, items: result.items.filter((item) => item.kind !== "quests"), counts: { ...result.counts, quests: 0 } };
};
