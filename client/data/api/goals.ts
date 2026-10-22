import { apiRequest } from "../http";
import type { Goal, GoalInput } from "@/types/social";

export const getGoals = () => apiRequest<Goal[]>("/goals");

export const createGoal = (data: GoalInput) => apiRequest<Goal>("/goals", { method: "POST", body: JSON.stringify(data) });

export const updateGoal = (id: string, data: Partial<GoalInput>) => apiRequest<Goal>(`/goals/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteGoal = (id: string) => apiRequest<unknown>(`/goals/${id}`, { method: "DELETE" });
