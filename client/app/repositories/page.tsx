"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ActivityBadge } from "@/components/activities/ActivityBadge";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { useActivityStore } from "@/lib/activityStore";
import { labelize } from "@/lib/constants";

export default function RepositoriesPage() {
  const { activities } = useActivityStore();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const repositories = useMemo(
    () =>
      Array.from(
        activities.reduce<Map<string, { organizationName: string; name: string; activities: typeof activities }>>((acc, activity) => {
          const key = `${activity.organizationName}/${activity.repositoryName}`;
          const current = acc.get(key) ?? {
            organizationName: activity.organizationName,
            name: activity.repositoryName,
            activities: []
          };
          acc.set(key, { ...current, activities: [...current.activities, activity] });
          return acc;
        }, new Map())
      ).map(([key, repo]) => ({ key, ...repo })),
    [activities]
  );

  return (
    <>
      <PageTitle
        title="Repositories"
        description="Repositories are collected from your manually added activities."
        action={<Button href="/activities/new">Add activity</Button>}
      />
      {repositories.length === 0 ? (
        <div className="rounded-xl border border-line bg-white p-8 text-center shadow-soft">
          <p className="text-lg font-bold">No repositories yet</p>
          <p className="mt-2 text-sm text-slate-500">Add an activity with a repository name to see it here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {repositories.map((repo) => {
            const expanded = expandedKey === repo.key;
            const typeCounts = Array.from(
              repo.activities.reduce<Map<string, number>>((acc, activity) => {
                acc.set(activity.activityType, (acc.get(activity.activityType) ?? 0) + 1);
                return acc;
              }, new Map())
            );
            return (
              <article key={repo.key} className="rounded-2xl border border-line bg-white p-5 shadow-soft">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-2xl font-extrabold tracking-tight text-ink">{repo.name}</h2>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-500">{repo.organizationName}</p>
                  </div>
                  <span className="rounded-lg border border-line bg-skyglass px-2 py-1 text-xs font-bold text-moss">Active</span>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedKey(expanded ? null : repo.key)}
                  className="mt-5 h-10 w-full rounded-lg border border-line bg-skyglass text-sm font-bold text-ink transition hover:border-moss"
                >
                  {expanded ? "Hide details" : "Expand repository"}
                </button>
                <Link
                  href={`/repos/${encodeURIComponent(repo.organizationName)}/${encodeURIComponent(repo.name)}`}
                  className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-moss text-sm font-bold text-black transition hover:brightness-105"
                >
                  Open repo profile
                </Link>
                {expanded ? (
                  <div className="mt-5 space-y-4 border-t border-line pt-5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-skyglass p-4">
                        <p className="text-2xl font-extrabold text-moss">{repo.activities.length}</p>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Activities</p>
                      </div>
                      <div className="rounded-xl bg-skyglass p-4">
                        <p className="text-2xl font-extrabold text-moss">{typeCounts.length}</p>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Types</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {typeCounts.map(([type, count]) => (
                        <span key={type} className="rounded-lg bg-skyglass px-3 py-2 text-xs font-bold text-slate-500">
                          {labelize(type)} <strong className="text-moss">{count}</strong>
                        </span>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {repo.activities.slice(0, 4).map((activity) => (
                        <div key={activity.id} className="rounded-xl border border-line bg-skyglass p-3">
                          <ActivityBadge value={activity.activityType} />
                          <p className="mt-2 truncate text-sm font-bold text-ink">{activity.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
