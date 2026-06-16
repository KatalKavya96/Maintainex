"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Home,
  Compass,
  Code2,
  Heart,
  Link2,
  LogOut,
  Moon,
  ClipboardList,
  Sparkles,
  Settings,
  Star,
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
  { href: "/reports", label: "Reports", icon: Sparkles },
  { href: "/pins", label: "Pins", icon: Link2 },
  { href: "/schedule", label: "Schedule", icon: ClipboardList },
  { href: "/leaderboard", label: "Leaderboards", icon: Trophy },
  { href: "/settings", label: "Settings", icon: Settings }
];

const startContributingItems = [
  { href: "/explore/organizations", label: "Explore Organizations", icon: Compass },
  { href: "/explore/repositories", label: "Find Repositories", icon: Code2 },
  { href: "/explore/quests", label: "Browse Quests", icon: Bookmark },
  { href: "/explore/recommended", label: "Recommended for You", icon: Star },
  { href: "/explore/saved", label: "Saved Opportunities", icon: Heart }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isReady, logout } = useAuthStore();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }

  function toggleSidebar() {
    setCollapsed((value) => !value);
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
  const profileHref = user.id === "viewer" ? "/coming-soon?feature=Viewer%20profile" : `/profile/${profileUsername}`;

  return (
    <div className="min-h-screen bg-[var(--app-bg)] lg:flex">
      <aside className={clsx("border-line bg-white transition-all lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:flex-col lg:border-r", collapsed ? "lg:w-[68px]" : "lg:w-[260px]")}>
        <div className={clsx("flex h-16 items-center gap-3 border-b border-line px-4", collapsed ? "justify-center" : "justify-between")}>
          <Link href="/" className={clsx("min-w-0", collapsed && "hidden lg:block")}>
            <p className={clsx("font-extrabold tracking-tight text-ink", collapsed ? "text-lg" : "text-2xl")}>
              {collapsed ? "Mx" : <>Maintain<span className="text-moss">ex</span></>}
            </p>
          </Link>
          <button
            type="button"
            onClick={toggleSidebar}
            className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-skyglass text-moss transition hover:border-moss hover:text-ink"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        <nav className={clsx("flex gap-2 overflow-x-auto px-3 py-4 lg:flex lg:flex-1 lg:flex-col lg:overflow-y-auto", collapsed && "lg:px-2")}>
          <div className="space-y-1">
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
                    "flex min-w-max items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-semibold transition",
                    collapsed && "lg:justify-center lg:px-0",
                    active
                      ? "border border-moss/30 bg-moss/25 text-moss shadow-[0_0_28px_rgba(201,244,58,0.12)]"
                      : "text-slate-400 hover:bg-skyglass hover:text-ink"
                  )}
                  title={item.label}
                >
                  <Icon size={20} />
                  <span className={clsx(collapsed && "lg:hidden")}>{item.label}</span>
                </Link>
              );
            })}
          </div>
          <div className={clsx("mt-4 border-t border-line pt-4", collapsed && "lg:hidden")}>
            <div className="mb-2 flex items-center justify-between px-3 text-sm font-extrabold text-moss">
              <span>Start Contributing</span>
              <ChevronUp size={16} />
            </div>
            <div className="space-y-1">
              {startContributingItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "flex min-w-max items-center gap-3 rounded-lg border px-3 py-2.5 text-[15px] font-semibold transition",
                      active
                        ? "border-moss bg-moss/25 text-ink shadow-[0_0_30px_rgba(201,244,58,0.15)]"
                        : "border-transparent text-slate-400 hover:bg-skyglass hover:text-ink"
                    )}
                    title={item.label}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className={clsx("hidden space-y-1 border-t border-line pt-4", collapsed && "lg:block")}>
            {startContributingItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx("flex items-center justify-center rounded-lg border py-2.5 transition", active ? "border-moss bg-moss/25 text-moss" : "border-transparent text-slate-400 hover:bg-skyglass hover:text-ink")}
                  title={item.label}
                >
                  <Icon size={20} />
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="border-t border-line px-3 py-2.5">
          <button
            className={clsx("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-400 transition hover:bg-skyglass hover:text-ink", collapsed && "lg:justify-center lg:px-0")}
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
      <main className={clsx("w-full min-w-0 transition-all", collapsed ? "lg:pl-[68px]" : "lg:pl-[260px]")}>
        <header className="sticky top-0 z-30 border-b border-line bg-white/90 px-3 py-3 backdrop-blur lg:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-[min(100%,22rem)] flex-1 items-center gap-2 sm:min-w-0">
              <UserSearch />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-line bg-skyglass px-2.5 text-sm font-semibold text-ink transition hover:border-moss"
                title="Toggle theme"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                {theme === "dark" ? "Light" : "Dark"}
              </button>
              <NotificationMenu />
              <Link
                href={profileHref}
                className="flex h-8 items-center gap-2 rounded-lg border border-line bg-skyglass px-2 transition hover:border-moss"
                title="Open profile"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-moss text-xs font-black text-black">{user.name.slice(0, 1).toUpperCase()}</span>
                <span className="hidden max-w-28 truncate text-sm font-semibold text-ink md:block">@{profileUsername}</span>
              </Link>
            </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1540px] px-3 py-4 lg:px-7">{children}</div>
      </main>
    </div>
  );
}
