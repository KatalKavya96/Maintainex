"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Home,
  Link2,
  LogOut,
  Moon,
  ClipboardList,
  Settings,
  Sun,
  Trophy
} from "lucide-react";
import clsx from "clsx";
import { useAuthStore } from "@/lib/authStore";
import { realtimeDashboardEvent } from "@/lib/activityStore";
import { connectRealtime, disconnectRealtime } from "@/lib/realtime";
import { NotificationMenu } from "@/components/layout/NotificationMenu";
import { UserSearch } from "@/components/layout/UserSearch";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/activities", label: "Activities", icon: Activity },
  { href: "/pins", label: "Pins", icon: Link2 },
  { href: "/schedule", label: "Schedule", icon: ClipboardList },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isReady, logout } = useAuthStore();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("maintainex.theme");
    const nextTheme = stored === "light" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    setCollapsed(window.localStorage.getItem("maintainex.sidebar") === "collapsed");
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("maintainex.theme", nextTheme);
  }

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    window.localStorage.setItem("maintainex.sidebar", next ? "collapsed" : "expanded");
  }

  useEffect(() => {
    if (!isReady) return;
    if (!user && !isAuthPage) router.replace("/login");
  }, [isAuthPage, isReady, pathname, router, user]);

  useEffect(() => {
    if (!user || isAuthPage) return undefined;

    const socket = connectRealtime(user.id);
    const refreshDashboard = () => window.dispatchEvent(new Event(realtimeDashboardEvent));
    const refreshFeed = () => window.dispatchEvent(new Event("maintainex-feed-new"));
    const refreshNotifications = () => window.dispatchEvent(new Event("maintainex-notifications-changed"));

    socket?.on("dashboard:update", refreshDashboard);
    socket?.on("feed:new", refreshFeed);
    socket?.on("notification:new", refreshNotifications);

    return () => {
      socket?.off("dashboard:update", refreshDashboard);
      socket?.off("feed:new", refreshFeed);
      socket?.off("notification:new", refreshNotifications);
      disconnectRealtime();
    };
  }, [isAuthPage, user?.id]);

  if (isAuthPage) {
    return <main className="min-h-screen px-5 py-8">{children}</main>;
  }

  if (!isReady || !user) {
    return <main className="grid min-h-screen place-items-center text-sm font-medium text-slate-500">Loading session...</main>;
  }
  const profileUsername = user.username || user.id;

  return (
    <div className="min-h-screen bg-[var(--app-bg)] lg:flex">
      <aside className={clsx("border-line bg-white transition-all lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:flex-col lg:border-r", collapsed ? "lg:w-[76px]" : "lg:w-64")}>
        <div className={clsx("flex h-16 items-center gap-3 border-b border-line px-4", collapsed ? "justify-center" : "justify-between")}>
          <Link href="/" className={clsx("min-w-0", collapsed && "hidden lg:block")}>
            <p className={clsx("font-extrabold tracking-tight text-ink", collapsed ? "text-xl" : "text-2xl")}>
              {collapsed ? "Mx" : <>Maintain<span className="text-moss">ex</span></>}
            </p>
          </Link>
          <button
            type="button"
            onClick={toggleSidebar}
            className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-skyglass text-slate-500 transition hover:border-moss hover:text-ink"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        <nav className={clsx("flex gap-2 overflow-x-auto px-3 py-5 lg:block lg:flex-1 lg:space-y-1 lg:overflow-y-auto", collapsed && "lg:px-2")}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href === "/activities" && pathname.startsWith("/activities/") && pathname !== "/activities/new") ||
              (item.href !== "/" && item.href !== "/activities" && item.href !== "/activities/new" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex min-w-max items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                  collapsed && "lg:justify-center lg:px-0",
                  active ? "bg-[#39A84A] text-white" : "text-slate-400 hover:bg-skyglass hover:text-ink"
                )}
                title={item.label}
              >
                <Icon size={19} />
                <span className={clsx(collapsed && "lg:hidden")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line px-3 py-3">
          <button
            className={clsx("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-skyglass hover:text-ink", collapsed && "lg:justify-center lg:px-0")}
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            title="Logout"
          >
            <LogOut size={18} />
            <span className={clsx(collapsed && "lg:hidden")}>Logout</span>
          </button>
        </div>
      </aside>
      <main className={clsx("w-full transition-all", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
        <header className="sticky top-0 z-30 border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/" className="hidden h-9 items-center rounded-lg px-2 text-sm font-extrabold text-ink transition hover:bg-skyglass sm:inline-flex">
                Home
              </Link>
              <UserSearch />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-skyglass px-3 text-sm font-semibold text-ink transition hover:border-moss"
                title="Toggle theme"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                {theme === "dark" ? "Light" : "Dark"}
              </button>
              <NotificationMenu />
              <Link
                href={`/profile/${profileUsername}`}
                className="flex items-center gap-2 rounded-lg border border-line bg-skyglass px-2 py-1.5 transition hover:border-moss"
                title="Open profile"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-moss text-xs font-black text-black">{user.name.slice(0, 1).toUpperCase()}</span>
                <span className="hidden max-w-28 truncate text-sm font-semibold text-ink md:block">@{profileUsername}</span>
              </Link>
            </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1280px] px-4 py-5 lg:px-6">{children}</div>
      </main>
    </div>
  );
}
