"use client";

import Link from "next/link";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { useActivityStore } from "@/lib/activityStore";

export default function OrganizationsPage() {
  const { activities } = useActivityStore();
  const organizations = Array.from(
    activities.reduce<Map<string, number>>((acc, activity) => {
      acc.set(activity.organizationName, (acc.get(activity.organizationName) ?? 0) + 1);
      return acc;
    }, new Map())
  ).map(([name, count]) => ({ name, count }));

  return (
    <>
      <PageTitle
        title="Organizations"
        description="Organizations are collected from your manually added activities."
        action={<Button href="/activities/new">Add activity</Button>}
      />
      {organizations.length === 0 ? (
        <div className="rounded-xl border border-line bg-white p-8 text-center shadow-soft">
          <p className="text-lg font-bold">No organizations yet</p>
          <p className="mt-2 text-sm text-slate-500">Add an activity with an organization name to see it here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {organizations.map((org) => (
            <article key={org.name} className="rounded-xl border border-line bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold">{org.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Collected from manual activity entries.</p>
                </div>
                <span className="rounded-lg bg-skyglass px-2 py-1 text-xs font-bold text-moss">{org.count} activities</span>
              </div>
              <Link href={`/orgs/${encodeURIComponent(org.name)}`} className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-moss px-4 text-sm font-bold text-black">
                Open org profile
              </Link>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
