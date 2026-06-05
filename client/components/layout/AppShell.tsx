"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  FolderGit2,
  Home,
  Link2,
  LogOut,
  Plus,
  ClipboardList,
  Settings,
  ShieldCheck,
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
    <div className="min-h-screen lg:flex">
      <aside className="border-line bg-white/92 lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:border-r">
        <div className="flex h-20 items-center gap-3 px-6">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-moss text-white">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-lg font-bold">Maintainex</p>
            <p className="text-xs text-slate-500">Open-source activity tracker</p>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:block lg:space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex min-w-max items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-skyglass text-ink" : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line px-4 py-4">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{user.role}</p>
          <p className="mt-1 truncate px-3 text-sm font-semibold text-slate-700">{user.name}</p>
          <button
            className="mt-3 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-ink"
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
        <header className="sticky top-0 z-10 border-b border-line bg-white/82 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-moss">Personal dashboard</p>
              <h1 className="text-2xl font-bold text-ink">Maintenance activity</h1>
            </div>
            <Link
              href="/activities/new"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-coral px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-[#d85e42]"
            >
              <Plus size={17} />
              Add activity
            </Link>
          </div>
        </header>
        <div className="px-5 py-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
