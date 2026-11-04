"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { apiRequest, ApiRequestError } from "@/data/http";
import { clearSessionToken, getSessionToken, setSessionToken } from "@/data/session";

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
  sessionError: string;
  retrySession: () => void;
  isAdmin: boolean;
  isViewer: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: { name: string; email: string; password: string; adminCode?: string }) => Promise<void>;
  completeOAuthSession: (code: string, nonce: string) => Promise<void>;
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

  const [sessionError, setSessionError] = useState("");
  const requestVersion = useRef(0);
  const restoreSession = useCallback(() => {
    const version = ++requestVersion.current;
    const storedToken = getSessionToken();
    setSessionError("");
    if (!storedToken) { setIsReady(true); return; }
    setIsReady(false);
    setToken(storedToken);
    void apiRequest<AuthResponse>("/auth/me")
      .then(data => {
        if (version !== requestVersion.current) return;
        setSessionError("");
        persistSession(data);
        setToken(data.token);
        setUser(data.user);
      })
      .catch(reason => {
        if (version !== requestVersion.current) return;
        if (reason instanceof ApiRequestError && [401, 403].includes(reason.status)) {
          clearSessionToken(); setToken(null); setUser(null);
        } else {
          setSessionError("We could not verify your session. Check your connection and retry.");
        }
      })
      .finally(() => { if (version === requestVersion.current) setIsReady(true); });
  }, []);
  useEffect(() => {
    restoreSession();
    return () => { requestVersion.current++; };
  }, [restoreSession]);

  const store = useMemo<AuthStore>(
    () => ({
      user,
      token,
      isReady,
      sessionError,
      retrySession: restoreSession,
      isAdmin: user?.role === "ADMIN",
      // The anonymous "View as viewer" session, not the VIEWER role every non-admin account has.
      isViewer: user?.id === "viewer",
      login: async (email, password) => {
        const data = await apiRequest<AuthResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });
        requestVersion.current++;
        setIsReady(true);
        setSessionError("");
        persistSession(data);
        setToken(data.token);
        setUser(data.user);
      },
      signup: async (payload) => {
        const data = await apiRequest<AuthResponse>("/auth/signup", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        requestVersion.current++;
        setIsReady(true);
        setSessionError("");
        persistSession(data);
        setToken(data.token);
        setUser(data.user);
      },
      completeOAuthSession: async (code, nonce) => {
        const data = await apiRequest<AuthResponse>("/auth/oauth/session", {
          method: "POST",
          body: JSON.stringify({ code, nonce })
        });
        requestVersion.current++;
        setIsReady(true);
        setSessionError("");
        persistSession(data);
        setToken(data.token);
        setUser(data.user);
      },
      viewAsViewer: async () => {
        const data = await apiRequest<AuthResponse>("/auth/viewer", { method: "POST" });
        requestVersion.current++;
        setIsReady(true);
        setSessionError("");
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
        requestVersion.current++;
        setIsReady(true);
        setSessionError("");
        clearSessionToken();
        window.dispatchEvent(new Event(AUTH_EVENT));
        setToken(null);
        setUser(null);
      }
    }),
    [isReady, token, user, sessionError, restoreSession]
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
