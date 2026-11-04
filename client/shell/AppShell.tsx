"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";
import { useAuthStore } from "@/state/auth";
import { useRealtimeEvents } from "./hooks/useRealtimeEvents";
import { SessionRecovery } from "./SessionRecovery";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ActivityProvider } from "@/state/activities";
import { isPublicRoute } from "@/shared/lib/routes";
import { useGitHubAutoSync } from "@/features/settings";

/** Public entry is independent; providers for private records mount inside the workspace. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isReady, logout, sessionError, retrySession } = useAuthStore();
  const authPage = isPublicRoute(pathname);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { setMobileOpen(false); },[pathname]);
  useEffect(() => {
    const stored = localStorage.getItem("maintainex-theme");
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; },[theme]);
  useEffect(() => { if (isReady && !user && !sessionError && !authPage) router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`); },[isReady,user,sessionError,authPage,router,pathname]);
  useRealtimeEvents(!authPage ? user?.id : undefined);
  useGitHubAutoSync(!authPage && Boolean(user) && user?.id !== "viewer");
  if (authPage) return <main id="main-content" className={pathname === "/" ? "min-h-screen" : "min-h-screen px-5 py-8"}>{children}</main>;
  if (sessionError) return <SessionRecovery message={sessionError} onRetry={retrySession} onLogout={logout} />;
  if (!isReady || !user) return <main role="status" className="grid min-h-screen place-items-center text-sm text-muted">Loading session…</main>;
  return <ActivityProvider><div className="min-h-screen bg-canvas lg:flex">
    <Sidebar pathname={pathname} collapsed={collapsed} mobileOpen={mobileOpen} onCollapse={() => setCollapsed(v=>!v)} onMenu={() => setMobileOpen(v=>!v)} onLogout={() => { logout(); router.replace("/"); }} />
    <main className={clsx("w-full min-w-0",collapsed ? "lg:pl-[72px]" : "lg:pl-[232px]")}>
      <Topbar user={user} theme={theme} onTheme={() => setTheme(v=>{ const next = v === "dark" ? "light" : "dark"; localStorage.setItem("maintainex-theme",next); return next; })} />
      <div className="mx-auto w-full max-w-[1540px] px-4 py-6 lg:px-7">{children}</div>
    </main>
  </div></ActivityProvider>;
}
