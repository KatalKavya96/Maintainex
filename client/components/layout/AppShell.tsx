"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  FolderGit2,
  Home,
  Link2,
  LogOut,
  Moon,
  Plus,
  ClipboardList,
  Settings,
  Sun,
  UserRoundSearch,
  Users
} from "lucide-react";
import clsx from "clsx";
import { useAuthStore } from "@/lib/authStore";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/activities", label: "Activities", icon: Activity },
  { href: "/activities/new", label: "Add Activity", icon: Plus },
  { href: "/pins", label: "Pins", icon: Link2 },
  { href: "/schedule", label: "Schedule", icon: ClipboardList },
  { href: "/profiles", label: "Profiles", icon: UserRoundSearch },
  { href: "/organizations", label: "Organizations", icon: Users },
  { href: "/repositories", label: "Repositories", icon: FolderGit2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isReady, logout } = useAuthStore();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem("maintainex.theme");
    const nextTheme = stored === "light" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("maintainex.theme", nextTheme);
  }

  useEffect(() => {
    if (!isReady) return;
    if (!user && !isAuthPage) router.replace("/login");
  }, [isAuthPage, isReady, pathname, router, user]);

  if (isAuthPage) {
    return <main className="min-h-screen px-5 py-8">{children}</main>;
  }

  if (!isReady || !user) {
    return <main className="grid min-h-screen place-items-center text-sm font-medium text-slate-500">Loading session...</main>;
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] lg:flex">
      <aside className="border-line bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-72 lg:flex-col lg:border-r">
        <div className="flex h-28 items-center justify-between gap-3 border-b border-line px-6">
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-ink">
              Maintain<span className="text-moss">ex</span>
            </p>
            <p className="mt-2 text-sm font-bold uppercase tracking-wide text-slate-500">Platform</p>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-full border border-slate-600/50 text-slate-400 transition hover:border-moss hover:text-moss" title="Collapse sidebar">
            <ChevronLeft size={18} />
          </button>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 py-8 lg:block lg:flex-1 lg:space-y-4 lg:overflow-y-auto">
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
                  "flex min-w-max items-center gap-4 rounded-xl px-5 py-4 text-base font-bold transition",
                  active ? "bg-[#39A84A] text-white" : "text-slate-400 hover:bg-skyglass hover:text-ink"
                )}
              >
                <Icon size={23} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line px-4 py-4">
          <div className="rounded-xl border border-line bg-skyglass p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{user.role}</p>
            <p className="mt-1 truncate text-base font-bold text-ink">{user.name}</p>
            <p className="truncate text-sm font-semibold text-slate-500">{user.email}</p>
          </div>
          <button
            className="mt-4 flex w-full items-center gap-3 rounded-xl px-5 py-3 text-base font-bold text-slate-400 transition hover:bg-skyglass hover:text-ink"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
      <main className="w-full lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-line bg-white/90 px-5 py-5 backdrop-blur lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-moss">Maintainex workspace</p>
              <h1 className="text-2xl font-extrabold tracking-tight text-ink">Contribution dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-line bg-skyglass px-4 text-sm font-black text-ink transition hover:border-moss"
                title="Toggle theme"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                {theme === "dark" ? "Light" : "Dark"}
              </button>
              <Link
                href="/activities/new"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-moss px-5 text-sm font-black text-black shadow-[0_10px_28px_rgba(201,244,58,0.18)] transition hover:brightness-105"
              >
                <Plus size={18} />
                Add activity
              </Link>
            </div>
          </div>
        </header>
        <div className="px-5 py-7 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
