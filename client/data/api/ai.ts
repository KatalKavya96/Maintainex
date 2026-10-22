import { apiRequest } from "../http";
import type { AiCoachResponse, AiContributionPlan, AiIssuePrContext, AiMaintainerMemory, AiReviewNotes, AiWeeklyReport } from "@/types/ai";

export const getAiWeeklyReport = () => apiRequest<AiWeeklyReport>("/ai/report");

export const askAiCoach = (question: string) => apiRequest<AiCoachResponse>("/ai/coach", { method: "POST", body: JSON.stringify({ question }) });

export const getAiContributionPlan = () => apiRequest<AiContributionPlan>("/ai/plan");

export const generateAiIssuePrContext = (url: string) => apiRequest<AiIssuePrContext>("/ai/context", { method: "POST", body: JSON.stringify({ url }) });

export const generateAiReviewNotes = (notes: string) => apiRequest<AiReviewNotes>("/ai/review-notes", { method: "POST", body: JSON.stringify({ notes }) });

export const getAiMaintainerMemory = () => apiRequest<AiMaintainerMemory>("/ai/memory");
