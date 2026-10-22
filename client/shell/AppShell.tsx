"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";
import { useAuthStore } from "@/state/auth";
import { useRealtimeEvents } from "./hooks/useRealtimeEvents";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/** Authentication behavior is preserved. Public-entry routing is explicitly deferred. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isReady, logout } = useAuthStore();
  const authPage = pathname === "/login" || pathname === "/signup" || pathname === "/design-system";
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { setMobileOpen(false); },[pathname]);
  useEffect(() => { document.documentElement.dataset.theme = theme; },[theme]);
  useEffect(() => { if (isReady && !user && !authPage) router.replace("/login"); },[isReady,user,authPage,router]);
  useRealtimeEvents(!authPage ? user?.id : undefined);
  if (authPage) return <main className="min-h-screen px-5 py-8">{children}</main>;
  if (!isReady || !user) return <main role="status" className="grid min-h-screen place-items-center text-sm text-muted">Loading session…</main>;
  return <div className="min-h-screen bg-canvas lg:flex">
    <Sidebar pathname={pathname} collapsed={collapsed} mobileOpen={mobileOpen} onCollapse={() => setCollapsed(v=>!v)} onMenu={() => setMobileOpen(v=>!v)} onLogout={() => { logout(); router.replace("/login"); }} />
    <main className={clsx("w-full min-w-0",collapsed ? "lg:pl-[72px]" : "lg:pl-[232px]")}>
      <Topbar user={user} theme={theme} onTheme={() => setTheme(v=>v === "dark" ? "light" : "dark")} />
      <div className="mx-auto w-full max-w-[1540px] px-4 py-6 lg:px-7">{children}</div>
    </main>
  </div>;
}
