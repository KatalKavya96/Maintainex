"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageTitle } from "@/components/common/PageTitle";
import { getLeaderboard } from "@/lib/api";
import type { LeaderboardEntry } from "@/types/social";

const periods = ["all", "weekly", "monthly", "yearly"];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState("monthly");

  useEffect(() => {
    getLeaderboard({ period: period === "all" ? "" : period }).then(setEntries).catch(() => setEntries([]));
  }, [period]);

  return (
    <>
      <PageTitle title="Leaderboard" description="Compare contribution score across Maintainex users." />
      <div className="mb-5 flex flex-wrap gap-2">
        {periods.map((item) => (
          <button key={item} type="button" onClick={() => setPeriod(item)} className={`rounded-lg px-4 py-2 text-sm font-bold capitalize ${period === item ? "bg-moss text-black" : "border border-line bg-white text-slate-500"}`}>
            {item}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-skyglass text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">PR reviews</th>
              <th className="px-4 py-3">PRs raised</th>
              <th className="px-4 py-3">Issues</th>
              <th className="px-4 py-3">Streak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {entries.map((entry, index) => (
              <tr key={entry.user.id}>
                <td className="px-4 py-3 font-extrabold text-moss">#{index + 1}</td>
                <td className="px-4 py-3">
                  <Link href={`/profile/${entry.user.username}`} className="font-bold text-ink hover:text-moss">{entry.user.name}</Link>
                  <p className="text-xs font-semibold text-slate-500">@{entry.user.username}</p>
                </td>
                <td className="px-4 py-3 font-extrabold">{entry.score}</td>
                <td className="px-4 py-3">{entry.counts.PR_REVIEWED ?? 0}</td>
                <td className="px-4 py-3">{entry.counts.PR_RAISED ?? 0}</td>
                <td className="px-4 py-3">{(entry.counts.ISSUE_RAISED ?? 0) + (entry.counts.ISSUE_CLOSED ?? 0)}</td>
                <td className="px-4 py-3">{entry.streak}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
