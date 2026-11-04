import Link from "next/link";
import { ArrowUpRight, UserRound, LockKeyhole, Target, Bell } from "lucide-react";
import { PageHeader, Surface } from "@/design-system";
import { GitHubAutomationPanel } from "../components/GitHubAutomationPanel";
import { SessionsPanel } from "../components/SessionsPanel";

const settings = [
  { icon: UserRound, title: "Profile", description: "Update your name, bio and contribution identity.", href: "/profile/edit" },
  { icon: LockKeyhole, title: "Password", description: "Manage your account password.", href: "/profile/change-password" },
  { icon: Target, title: "Contribution goals", description: "Review and manage your contribution targets.", href: "/goals" },
  { icon: Bell, title: "Notifications", description: "Read updates and manage unread messages.", href: "/notifications" }
];

export default function SettingsPage() {
  return <><PageHeader title="Settings" description="Your account and connected contribution workflow." /><div className="mb-8 grid gap-4 md:grid-cols-2">{settings.map(({icon:Icon,...item})=><Surface key={item.title}><Link href={item.href} className="flex items-start gap-4"><Icon size={20} className="mt-1 shrink-0 text-muted" /><div className="flex-1"><h2 className="font-medium">{item.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{item.description}</p></div><ArrowUpRight size={16} className="text-muted" /></Link></Surface>)}</div><GitHubAutomationPanel /><SessionsPanel /><p className="mt-6 text-xs text-muted">Appearance: use the theme control in the workspace header. Your choice is saved on this device.</p></>;
}
