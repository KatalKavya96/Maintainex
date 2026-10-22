"use client";
import Link from "next/link";
import clsx from "clsx";
import { navigation } from "./navigation";

export function Navigation({ pathname, collapsed }: { pathname: string; collapsed: boolean }) {
  return <nav id="main-navigation" aria-label="Main navigation" className="space-y-1 px-3 py-4">
    {navigation.map(({ href, label, icon: Icon }) => {
      const active = href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
      return <Link key={href} href={href} title={label} aria-current={active ? "page" : undefined}
        className={clsx("flex min-h-11 items-center gap-3 rounded-lg border px-3 text-sm font-medium transition", collapsed && "lg:justify-center lg:px-0", active ? "border-line bg-moss/10 text-moss" : "border-transparent text-muted hover:bg-skyglass hover:text-ink")}>
        <Icon size={18} /><span className={clsx(collapsed && "lg:hidden")}>{label}</span>
      </Link>;
    })}
  </nav>;
}
