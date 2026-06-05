"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ActivityLineChart, ActivityTypeChart } from "@/components/analytics/Charts";
import { PageTitle } from "@/components/common/PageTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { DueStatusBadge } from "@/components/schedule/DueStatusBadge";
import { PriorityBadge } from "@/components/schedule/PriorityBadge";
import { chartByOrganization, chartByRepository, summaryStats } from "@/lib/analytics";
import { getProfileDashboard } from "@/lib/api";
import type { ProfileDashboard } from "@/types/profile";

export default function ProfileDashboardPage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<ProfileDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getProfileDashboard(params.id)
      .then((data) => {
        setProfile(data);
        setError("");
      })
      .catch((err) => setError(err.message ?? "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [params.id]);

  const activities = useMemo(() => profile?.activities ?? [], [profile]);
  const orgs = useMemo(() => chartByOrganization(activities), [activities]);
  const repos = useMemo(() => chartByRepository(activities), [activities]);

  if (loading) return <div className="rounded-md border border-line bg-white p-8 text-sm text-slate-500 shadow-soft">Loading profile...</div>;
  if (error || !profile) return <div className="rounded-md border border-red-200 bg-red-50 p-8 text-sm font-semibold text-red-700">{error || "Profile not found"}</div>;

  return (
    <>
      <PageTitle title={`${profile.user.name}'s Dashboard`} description="Read-only profile view. You can inspect this user's activity, but cannot modify their data." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryStats(activities).map((stat) => <StatCard key={stat.label} {...stat} />)}
        <StatCard label="Pinned Links" value={profile.stats.pins} />
        <StatCard label="Future Work" value={profile.stats.scheduledWork} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-md border border-line bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Favorite Pins</h2>
            <span className="text-xs font-bold uppercase text-slate-400">Read only</span>
          </div>
          {profile.favoritePins.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {profile.favoritePins.map((pin) => (
                <a key={pin.id} href={pin.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-md border border-line p-3 text-sm font-semibold transition hover:bg-slate-50">
                  <img src={pin.imageUrl || pin.faviconUrl || ""} alt="" className="h-6 w-6 rounded object-contain" />
                  <span className="truncate">{pin.title}</span>
                </a>
              ))}
            </div>
          ) : <p className="text-sm text-slate-500">No favorite pins yet.</p>}
        </section>

        <section className="rounded-md border border-line bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Upcoming Work</h2>
            <span className="text-xs font-bold uppercase text-slate-400">Read only</span>
          </div>
          {profile.upcomingWork.length ? (
            <div className="space-y-3">
              {profile.upcomingWork.map((item) => (
                <article key={item.id} className="rounded-md border border-line p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-ink">{item.title}</p>
                    <PriorityBadge priority={item.priority} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{item.organizationName}/{item.repositoryName}</p>
                  <div className="mt-2">
                    <DueStatusBadge dueDate={item.dueDate} status={item.status} />
                  </div>
                </article>
              ))}
            </div>
          ) : <p className="text-sm text-slate-500">No scheduled work yet.</p>}
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ActivityLineChart activities={activities} />
        <ActivityTypeChart activities={activities} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-md border border-line bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-bold">Repositories</h2>
          <div className="space-y-2">
            {repos.map((repo) => <p key={repo.name} className="flex justify-between rounded bg-slate-50 px-3 py-2 text-sm"><span>{repo.name}</span><strong>{repo.value}</strong></p>)}
          </div>
        </section>
        <section className="rounded-md border border-line bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-bold">Organizations</h2>
          <div className="space-y-2">
            {orgs.map((org) => <p key={org.name} className="flex justify-between rounded bg-slate-50 px-3 py-2 text-sm"><span>{org.name}</span><strong>{org.value}</strong></p>)}
          </div>
        </section>
      </div>

      <div className="mt-6">
        <Link href="/profiles" className="text-sm font-semibold text-moss">Back to profiles</Link>
      </div>
    </>
  );
}
