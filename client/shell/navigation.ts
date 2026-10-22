import { Activity, BarChart3, ClipboardList, Compass, Home, Link2, Settings, type LucideIcon } from "lucide-react";

export type NavigationItem = { href: string; label: string; icon: LucideIcon };
/** Add a retained destination here; UI rendering does not change. */
export const navigation: readonly NavigationItem[] = [
  { href: "/", label: "Community", icon: Home },
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/activities", label: "Activities", icon: Activity },
  { href: "/pins", label: "Pins", icon: Link2 },
  { href: "/schedule", label: "Work", icon: ClipboardList },
  { href: "/explore/organizations", label: "Organizations", icon: Compass },
  { href: "/settings", label: "Settings", icon: Settings }
];
