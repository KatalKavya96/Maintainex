import { apiRequest } from "../http";

export const getOAuthUrl = (provider: "google" | "github") => apiRequest<{ url: string }>(`/auth/oauth/${provider}/url`);
