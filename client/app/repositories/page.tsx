"use client";

import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { useActivityStore } from "@/lib/activityStore";

export default function RepositoriesPage() {
  const { activities } = useActivityStore();
  const repositories = Array.from(
    activities.reduce<Map<string, { organizationName: string; name: string; count: number }>>((acc, activity) => {
      const key = `${activity.organizationName}/${activity.repositoryName}`;
      const current = acc.get(key) ?? {
        organizationName: activity.organizationName,
        name: activity.repositoryName,
        count: 0
      };
      acc.set(key, { ...current, count: current.count + 1 });
      return acc;
    }, new Map())
  ).map(([, repo]) => repo);

  return (
    <>
      <PageTitle
        title="Repositories"
        description="Repositories are collected from your manually added activities."
        action={<Button href="/activities/new">Add activity</Button>}
      />
      {repositories.length === 0 ? (
        <div className="rounded-md border border-line bg-white p-8 text-center shadow-soft">
          <p className="text-lg font-bold">No repositories yet</p>
          <p className="mt-2 text-sm text-slate-500">Add an activity with a repository name to see it here.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-line bg-white shadow-soft">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Repository</th>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Activities</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {repositories.map((repo) => (
                <tr key={`${repo.organizationName}/${repo.name}`}>
                  <td className="px-4 py-3 font-semibold">{repo.name}</td>
                  <td className="px-4 py-3">{repo.organizationName}</td>
                  <td className="px-4 py-3 text-slate-600">{repo.count}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
