"use client";
import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, GitBranch, LogOut, Menu, X } from "lucide-react";
import { Navigation } from "./NavigationList";

export function Sidebar({ pathname, collapsed, mobileOpen, onCollapse, onMenu, onLogout }: {
  pathname: string; collapsed: boolean; mobileOpen: boolean; onCollapse: () => void; onMenu: () => void; onLogout: () => void;
}) {
  return <aside className={clsx("border-line bg-panel lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:flex-col lg:border-r", collapsed ? "lg:w-[72px]" : "lg:w-[232px]")}>
    <div className="flex h-16 items-center justify-between gap-2 border-b border-line px-4">
      <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight text-ink" aria-label="Maintainex home"><GitBranch size={20} className="text-moss" /><span className={clsx(collapsed && "lg:hidden")}>maintainex</span></Link>
      <button type="button" onClick={onCollapse} className="hidden h-8 w-8 place-items-center rounded-lg text-muted hover:bg-skyglass lg:grid" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button>
      <button type="button" onClick={onMenu} className="grid h-10 w-10 place-items-center rounded-lg text-muted lg:hidden" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} aria-controls="main-navigation">{mobileOpen ? <X size={18} /> : <Menu size={18} />}</button>
    </div>
    <div className={clsx("overflow-y-auto lg:block lg:flex-1", mobileOpen ? "max-h-[65vh]" : "hidden")}><Navigation pathname={pathname} collapsed={collapsed} /></div>
    <div className={clsx("border-t border-line p-3 lg:block", !mobileOpen && "hidden")}><button type="button" onClick={onLogout} title="Logout" className={clsx("flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-muted hover:bg-skyglass", collapsed && "lg:justify-center lg:px-0")}><LogOut size={18} /><span className={clsx(collapsed && "lg:hidden")}>Logout</span></button></div>
  </aside>;
}
