"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";

export type UserRole = "ADMIN" | "VIEWER";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isReady: boolean;
  isAdmin: boolean;
  isViewer: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: { name: string; email: string; password: string; adminCode?: string }) => Promise<void>;
  viewAsViewer: () => Promise<void>;
  logout: () => void;
}

const TOKEN_KEY = "maintainex.token";
const USER_KEY = "maintainex.user";
const AUTH_EVENT = "maintainex-auth-changed";

const AuthContext = createContext<AuthStore | undefined>(undefined);

function persistSession(data: AuthResponse) {
  window.localStorage.setItem(TOKEN_KEY, data.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    const storedUser = window.localStorage.getItem(USER_KEY);
    if (storedToken) setToken(storedToken);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as AuthUser);
      } catch {
        window.localStorage.removeItem(USER_KEY);
      }
    }
    setIsReady(true);
  }, []);

  const store = useMemo<AuthStore>(
    () => ({
      user,
      token,
      isReady,
      isAdmin: user?.role === "ADMIN",
      isViewer: user?.role === "VIEWER",
      login: async (email, password) => {
        const data = await apiRequest<AuthResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });
        persistSession(data);
        setToken(data.token);
        setUser(data.user);
      },
      signup: async (payload) => {
        const data = await apiRequest<AuthResponse>("/auth/signup", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        persistSession(data);
        setToken(data.token);
        setUser(data.user);
      },
      viewAsViewer: async () => {
        const data = await apiRequest<AuthResponse>("/auth/viewer", { method: "POST" });
        persistSession(data);
        setToken(data.token);
        setUser(data.user);
      },
      logout: () => {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
        window.dispatchEvent(new Event(AUTH_EVENT));
        setToken(null);
        setUser(null);
      }
    }),
    [isReady, token, user]
  );

  return <AuthContext.Provider value={store}>{children}</AuthContext.Provider>;
}

export function useAuthStore() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthStore must be used inside AuthProvider");
  }
  return context;
}

export const authChangedEvent = AUTH_EVENT;
