import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/common/MetricCard";

export interface RankingRow {
  id: string;
  label: string;
  sublabel?: string;
  avatarUrl?: string | null;
  value: string;
  href?: string;
}

export function LeaderboardCard({ title, description, icon, rows, valueLabel }: { title: string; description: string; icon: ReactNode; rows: RankingRow[]; valueLabel: string }) {
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-moss">{icon}</span>
          <div>
            <h2 className="text-lg font-extrabold text-ink">{title}</h2>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{description}</p>
          </div>
        </div>
        <Link href="/coming-soon?feature=full-leaderboard" className="shrink-0 rounded border border-moss/30 bg-moss/10 px-3 py-1.5 text-xs font-extrabold text-moss">
          View all
        </Link>
      </div>
      {rows.length ? (
        <>
          <div className="mb-2 grid grid-cols-[1fr_auto] text-xs font-semibold text-slate-400">
            <span>{title.includes("Repositories") ? "Repository" : title.includes("Organizations") ? "Organization" : "Contributor"}</span>
            <span>{valueLabel}</span>
          </div>
          <div className="space-y-2">
            {rows.slice(0, 5).map((row, index) => {
              const content = (
                <>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-moss/10 text-xs font-black text-moss">{index + 1}</span>
                  {row.avatarUrl ? (
                    <img src={row.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-skyglass text-xs font-black text-moss">{row.label.slice(0, 1).toUpperCase()}</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{row.label}</span>
                    {row.sublabel ? <span className="block truncate text-xs font-semibold text-slate-500">{row.sublabel}</span> : null}
                  </span>
                  <span className="shrink-0 text-sm font-black text-moss">{row.value}</span>
                </>
              );
              return row.href ? (
                <Link key={row.id} href={row.href} className="flex items-center gap-3 rounded-lg px-1.5 py-1.5 transition hover:bg-skyglass">
                  {content}
                </Link>
              ) : (
                <div key={row.id} className="flex items-center gap-3 rounded-lg px-1.5 py-1.5">
                  {content}
                </div>
              );
            })}
          </div>
          <Link href="/coming-soon?feature=full-leaderboard" className="mt-3 flex h-9 items-center justify-between rounded-lg border border-moss/20 bg-moss/5 px-3 text-sm font-bold text-moss">
            Explore full leaderboard
            <ArrowRight size={16} />
          </Link>
        </>
      ) : (
        <EmptyState title="No leaderboard data available yet." description="Sync GitHub activity or add contribution rows to populate this ranking." />
      )}
    </section>
  );
}
