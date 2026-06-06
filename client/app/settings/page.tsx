import { Bell, Download, Github, Moon, Target } from "lucide-react";
import Link from "next/link";
import { PageTitle } from "@/components/common/PageTitle";

const settings = [
  { icon: Github, title: "GitHub automation", description: "Future OAuth and activity sync hooks are planned." },
  { icon: Target, title: "Contribution goals", description: "Monthly and yearly target tracking can plug into the analytics model." },
  { icon: Download, title: "Export reports", description: "CSV, PDF, and AI-generated weekly reports are natural next additions." },
  { icon: Bell, title: "Reminders", description: "Reminder workflows can be attached to goals and stale activity checks." },
  { icon: Moon, title: "Dark mode", description: "The layout is ready for a theme toggle when needed." }
];

export default function SettingsPage() {
  return (
    <>
      <PageTitle title="Settings" description="A lightweight roadmap surface for the scalable features described in the README." />
      <div className="grid gap-4 md:grid-cols-2">
        {settings.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.title} href={`/coming-soon?feature=${encodeURIComponent(item.title)}`} className="block rounded-xl border border-line bg-white p-5 shadow-soft transition hover:border-moss">
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
