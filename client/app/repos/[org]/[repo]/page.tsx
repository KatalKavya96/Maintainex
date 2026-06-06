"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ActivityLineChart, ActivityTypeChart } from "@/components/analytics/Charts";
import { PageTitle } from "@/components/common/PageTitle";
import { getPins, getScheduledWork } from "@/lib/api";
import { useActivityStore } from "@/lib/activityStore";
import type { PinListResponse } from "@/types/pin";
import type { ScheduledWork } from "@/types/scheduledWork";

const monthKey = (date: string) => date.slice(0, 7);

export default function RepoProfilePage() {
  const params = useParams<{ org: string; repo: string }>();
  const org = decodeURIComponent(params.org);
  const repo = decodeURIComponent(params.repo);
  const { activities } = useActivityStore();
  const [pins, setPins] = useState<PinListResponse["items"]>([]);
  const [work, setWork] = useState<ScheduledWork[]>([]);

  useEffect(() => {
    Promise.all([getPins({ limit: 100 }), getScheduledWork({ limit: 100 })])
      .then(([pinData, workData]) => {
        const key = `${org}/${repo}`.toLowerCase();
        setPins(pinData.items.filter((pin) => `${pin.title} ${pin.url} ${pin.description}`.toLowerCase().includes(key) || pin.url.toLowerCase().includes(repo.toLowerCase())));
        setWork(workData.items.filter((item) => item.organizationName === org && item.repositoryName === repo));
      })
      .catch(() => undefined);
  }, [org, repo]);

  const repoActivities = useMemo(() => activities.filter((activity) => activity.organizationName === org && activity.repositoryName === repo), [activities, org, repo]);
  const mostActiveMonth = useMemo(() => {
    const counts = repoActivities.reduce<Record<string, number>>((acc, activity) => {
      acc[monthKey(activity.date)] = (acc[monthKey(activity.date)] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "No activity yet";
  }, [repoActivities]);
  const labels = Array.from(new Set(repoActivities.flatMap((activity) => activity.tags))).slice(0, 10);

  return (
    <>
      <PageTitle title={`${org}/${repo}`} description="Repository contribution profile and context." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Activities", repoActivities.length],
          ["PRs reviewed", repoActivities.filter((item) => item.activityType === "PR_REVIEWED").length],
          ["PRs raised", repoActivities.filter((item) => item.activityType === "PR_RAISED").length],
          ["Issues raised", repoActivities.filter((item) => item.activityType === "ISSUE_RAISED").length],
          ["Pending work", work.filter((item) => item.status !== "DONE" && item.status !== "CANCELLED").length]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-5 shadow-soft">
            <p className="text-3xl font-extrabold text-moss">{value}</p>
            <p className="mt-2 text-sm font-bold text-slate-500">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ActivityLineChart activities={repoActivities} />
        <ActivityTypeChart activities={repoActivities} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-line bg-white p-6 shadow-soft">
          <h2 className="text-xl font-extrabold">Repo context</h2>
          <dl className="mt-4 space-y-3 text-sm font-semibold text-slate-500">
            <div><dt className="text-moss">Most active month</dt><dd>{mostActiveMonth}</dd></div>
            <div><dt className="text-moss">Contribution rules</dt><dd>Keep links, review notes, and rules in pins tagged to this repo.</dd></div>
            <div><dt className="text-moss">Setup instructions</dt><dd>Add setup docs as pinned links for fast access.</dd></div>
          </dl>
        </section>
        <section className="rounded-2xl border border-line bg-white p-6 shadow-soft">
          <h2 className="text-xl font-extrabold">Important links</h2>
          <div className="mt-4 space-y-2">
            {pins.slice(0, 5).map((pin) => <a key={pin.id} href={pin.url} target="_blank" rel="noreferrer" className="block rounded-xl bg-skyglass p-3 text-sm font-bold text-ink hover:text-moss">{pin.title}</a>)}
            {!pins.length ? <p className="text-sm font-semibold text-slate-500">No repo pins yet.</p> : null}
          </div>
        </section>
        <section className="rounded-2xl border border-line bg-white p-6 shadow-soft">
          <h2 className="text-xl font-extrabold">Labels I work on</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {labels.map((label) => <span key={label} className="rounded-lg bg-skyglass px-3 py-2 text-sm font-bold text-moss">{label}</span>)}
            {!labels.length ? <p className="text-sm font-semibold text-slate-500">Tags from activities will appear here.</p> : null}
          </div>
        </section>
      </div>
      <div className="mt-6">
        <Link href="/repositories" className="text-sm font-bold text-moss">Back to repositories</Link>
      </div>
    </>
  );
}
