"use client";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import type { AuthUser } from "@/state/auth";
import { Button } from "@/design-system";
import { UserSearch } from "./UserSearch";
import { NotificationMenu } from "./NotificationMenu";

export function Topbar({ user, theme, onTheme }: { user: AuthUser; theme: "dark" | "light"; onTheme: () => void }) {
  const username = user.username || user.id;
  const href = user.id === "viewer" ? "/coming-soon?feature=Viewer%20profile" : `/profile/${username}`;
  return <header className="sticky top-0 z-30 border-b border-line bg-panel/95 px-4 py-3 backdrop-blur lg:px-7"><div className="flex flex-wrap items-center gap-3">
    <div className="min-w-[min(100%,20rem)] flex-1"><UserSearch /></div>
    <div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={onTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</Button><NotificationMenu />
      <Link href={href} title="Open profile" className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm text-muted hover:bg-skyglass"><span className="grid h-7 w-7 place-items-center rounded-full border border-line bg-skyglass text-xs text-ink">{user.name.slice(0,1).toUpperCase()}</span><span className="hidden max-w-28 truncate md:block">@{username}</span></Link>
    </div>
  </div></header>;
}
