import { apiRequest, queryString } from "../http";
import type { ProfileDashboard, ProfileSummary, ProfileUpdateInput, ProfileUser, UsernameAvailability } from "@/types/profile";

export const getProfiles = () => apiRequest<ProfileSummary[]>("/profiles");

export const getProfileDashboard = (userId: string) => apiRequest<ProfileDashboard>(`/profiles/${userId}`);

export const getProfileByUsername = (username: string) => apiRequest<ProfileDashboard>(`/profiles/username/${username}`);

export const checkUsernameAvailability = (username: string) => apiRequest<UsernameAvailability>(`/profiles/username-availability${queryString({ username })}`);

export const updateProfile = (data: ProfileUpdateInput) => apiRequest<ProfileUser>("/profiles/me", { method: "PUT", body: JSON.stringify(data) });

export const changePassword = (data: { currentPassword: string; newPassword: string }) => apiRequest<{ changed: boolean }>("/profiles/password", { method: "PATCH", body: JSON.stringify(data) });

export const resetWorkspaceData = (password: string) => apiRequest<Record<string, number>>("/profiles/reset-workspace", { method: "POST", body: JSON.stringify({ password }) });

export const sendEmailVerificationOtp = () => apiRequest<{ sent: boolean; alreadyVerified: boolean; message: string }>("/profiles/email-verification/send", { method: "POST" });

export const verifyEmailOtp = (code: string) => apiRequest<{ verified: boolean; user: ProfileUser }>("/profiles/email-verification/verify", { method: "POST", body: JSON.stringify({ code }) });
