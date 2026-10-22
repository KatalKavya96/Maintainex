import { getSessionToken } from "@/data/session";

const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:5001/api";
  }

  return "/api";
};

export const queryString = (params?: Record<string, string | number | boolean | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const value = query.toString();
  return value ? `?${value}` : "";
};

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getSessionToken();
  const { headers, ...requestOptions } = options ?? {};
  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("Content-Type")) requestHeaders.set("Content-Type", "application/json");
  if (token && !requestHeaders.has("Authorization")) requestHeaders.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${getApiUrl()}${path}`, {
    ...requestOptions,
    credentials: "include",
    headers: requestHeaders
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `API request failed: ${response.status}` }));
    throw new Error(error.message ?? `API request failed: ${response.status}`);
  }

  const json = await response.json();
  return json.data as T;
}

