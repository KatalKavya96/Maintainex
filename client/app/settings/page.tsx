import { Bell, Download, Moon, Target } from "lucide-react";
import Link from "next/link";
import { PageTitle } from "@/components/common/PageTitle";
import { GitHubAutomationPanel } from "@/components/settings/GitHubAutomationPanel";

const settings = [
  { icon: Target, title: "Contribution goals", description: "Monthly and yearly target tracking can plug into the analytics model.", href: "/goals" },
  { icon: Download, title: "AI reports", description: "Weekly summaries, contribution planning, and review notes are available now.", href: "/reports" },
  { icon: Bell, title: "Reminders", description: "Reminder workflows can be attached to goals and stale activity checks.", href: "/coming-soon?feature=Reminders" },
  { icon: Moon, title: "Dark mode", description: "Use the theme toggle in the top navigation to switch appearance.", href: "/dashboard" }
];

export default function SettingsPage() {
  return (
    <>
      <PageTitle title="Settings" description="A lightweight roadmap surface for the scalable features described in the README." />
      <GitHubAutomationPanel />
      <div className="grid gap-4 md:grid-cols-2">
        {settings.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.title} href={item.href} className="block rounded-xl border border-line bg-white p-5 shadow-soft transition hover:border-moss">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-skyglass text-moss">
                <Icon size={20} />
              </div>
              <h3 className="text-lg font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
