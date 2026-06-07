"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { clearSessionToken, getSessionToken, setSessionToken } from "@/lib/sessionToken";

export type UserRole = "ADMIN" | "VIEWER";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  emailVerifiedAt?: string | null;
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
  completeOAuthSession: (code: string) => Promise<void>;
  viewAsViewer: () => Promise<void>;
  updateUser: (user: Partial<AuthUser>) => void;
  logout: () => void;
}

const AUTH_EVENT = "maintainex-auth-changed";

const AuthContext = createContext<AuthStore | undefined>(undefined);

function persistSession(data: AuthResponse) {
  setSessionToken(data.token);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedToken = getSessionToken();
    if (!storedToken) {
      setIsReady(true);
      return;
    }
    setToken(storedToken);
    apiRequest<AuthResponse>("/auth/me")
      .then((data) => {
        persistSession(data);
        setToken(data.token);
        setUser(data.user);
      })
      .catch(() => {
        clearSessionToken();
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsReady(true));
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
      completeOAuthSession: async (code) => {
        const data = await apiRequest<AuthResponse>("/auth/oauth/session", {
          method: "POST",
          body: JSON.stringify({ code })
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
      updateUser: (partial) => {
        setUser((current) => {
          if (!current) return current;
          const next = { ...current, ...partial };
          window.dispatchEvent(new Event(AUTH_EVENT));
          return next;
        });
      },
      logout: () => {
        clearSessionToken();
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
