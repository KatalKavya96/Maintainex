"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ActivityLineChart, RepoChart } from "@/shared/analytics/Charts";
import { PageTitle } from "@/design-system/patterns/PageTitle";
import { getPins } from "@/data/api/pins";
import { getScheduledWork } from "@/data/api/work";
import { useActivityStore } from "@/state/activities";
import type { PinListResponse } from "@/types/pin";
import type { ScheduledWork } from "@/types/scheduledWork";

export default function OrgProfilePage() {
  const params = useParams<{ orgName: string }>();
  const orgName = decodeURIComponent(params.orgName);
  const { activities } = useActivityStore();
  const [pins, setPins] = useState<PinListResponse["items"]>([]);
  const [work, setWork] = useState<ScheduledWork[]>([]);

  useEffect(() => {
    Promise.all([getPins({ limit: 100 }), getScheduledWork({ limit: 100 })])
      .then(([pinData, workData]) => {
        setPins(pinData.items.filter((pin) => `${pin.title} ${pin.url} ${pin.description}`.toLowerCase().includes(orgName.toLowerCase())));
        setWork(workData.items.filter((item) => item.organizationName === orgName));
      })
      .catch(() => undefined);
  }, [orgName]);

  const orgActivities = useMemo(() => activities.filter((activity) => activity.organizationName === orgName), [activities, orgName]);
  const repos = Array.from(new Set(orgActivities.map((activity) => activity.repositoryName))).sort();

  return (
    <>
      <PageTitle title={orgName} description="Organization contribution profile and strategy." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Contributions", orgActivities.length],
          ["Repos", repos.length],
          ["Pending work", work.filter((item) => item.status !== "DONE" && item.status !== "CANCELLED").length],
          ["Pinned links", pins.length]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-panel p-5 shadow-soft">
            <p className="text-3xl font-semibold text-moss">{value}</p>
            <p className="mt-2 text-sm font-bold text-muted">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ActivityLineChart activities={orgActivities} />
        <RepoChart activities={orgActivities} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-line bg-panel p-6 shadow-soft">
          <h2 className="text-xl font-semibold">Repositories</h2>
          <div className="mt-4 space-y-2">
            {repos.map((repo) => <Link key={repo} href={`/repos/${encodeURIComponent(orgName)}/${encodeURIComponent(repo)}`} className="block rounded-xl bg-skyglass p-3 text-sm font-bold text-ink hover:text-moss">{repo}</Link>)}
          </div>
        </section>
        <section className="rounded-2xl border border-line bg-panel p-6 shadow-soft">
          <h2 className="text-xl font-semibold">Pinned org links</h2>
          <div className="mt-4 space-y-2">
            {pins.slice(0, 6).map((pin) => <a key={pin.id} href={pin.url} target="_blank" rel="noreferrer" className="block rounded-xl bg-skyglass p-3 text-sm font-bold text-ink hover:text-moss">{pin.title}</a>)}
            {!pins.length ? <p className="text-sm font-semibold text-muted">No org pins yet.</p> : null}
          </div>
        </section>
        <section className="rounded-2xl border border-line bg-panel p-6 shadow-soft">
          <h2 className="text-xl font-semibold">Contribution strategy</h2>
          <p className="mt-4 text-sm font-semibold leading-6 text-muted">Use this page as the org memory: pin docs, track active repos, and keep scheduled work tied to the org.</p>
        </section>
      </div>
      <div className="mt-6">
        <Link href="/dashboard" className="text-sm font-bold text-moss">Back to dashboard</Link>
      </div>
    </>
  );
}
