"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Mail, ShieldCheck } from "lucide-react";
import { ActivityLineChart, ActivityTypeChart, OrgChart, RepoChart } from "@/shared/analytics/Charts";
import { ActivityHeatmap } from "@/shared/calendar/ActivityHeatmap";
import { PageTitle } from "@/design-system/patterns/PageTitle";
import { formatDate } from "@/shared/lib/dateUtils";
import { getProfileDashboard } from "@/data/api/profile";
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
  const profileStats = useMemo(
    () => [
      { label: "Activities", value: profile?.stats.activities ?? 0 },
      { label: "Repositories", value: profile?.stats.repositories ?? 0 },
      { label: "Organizations", value: profile?.stats.organizations ?? 0 }
    ],
    [profile]
  );

  if (loading) return <div className="rounded-xl border border-line bg-panel p-8 text-sm text-muted shadow-soft">Loading profile...</div>;
  if (error || !profile) return <div className="rounded-xl border border-danger bg-skyglass p-8 text-sm font-semibold text-danger">{error || "Profile not found"}</div>;

  const initials = profile.user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <PageTitle title={`${profile.user.name}'s Profile`} description="Read-only contribution profile with activity history and public progress." />

      <section className="rounded-2xl border border-line bg-panel p-6 shadow-soft">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="grid h-24 w-24 place-items-center rounded-2xl border border-moss/35 bg-skyglass text-3xl font-semibold text-moss ">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-semibold tracking-tight text-ink">{profile.user.name}</h2>
                <span className="inline-flex items-center gap-1 rounded-lg border border-line bg-skyglass px-2 py-1 text-xs font-bold uppercase text-moss">
                  <ShieldCheck size={13} />
                  {profile.user.role}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-muted">
                <span className="inline-flex items-center gap-2">
                  <Mail size={16} />
                  {profile.user.email}
                </span>
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={16} />
                  Joined {formatDate(profile.user.createdAt.slice(0, 10))}
                </span>
              </div>
            </div>
          </div>
          <div className="grid min-w-[280px] grid-cols-3 gap-3">
            {profileStats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-line bg-skyglass p-4 text-center">
                <p className="text-2xl font-semibold text-moss">{stat.value}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-6">
        <ActivityHeatmap activities={activities} ownerName={profile.user.name} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ActivityLineChart activities={activities} />
        <ActivityTypeChart activities={activities} />
        <RepoChart activities={activities} />
        <OrgChart activities={activities} />
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-panel p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Recent activity</h2>
          <span className="text-xs font-bold uppercase text-muted">Read only</span>
        </div>
        {activities.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {activities.slice(0, 6).map((activity) => (
              <article key={activity.id} className="rounded-xl border border-line bg-skyglass p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-ink">{activity.title}</p>
                  <span className="text-xs font-bold text-muted">{formatDate(activity.date)}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-muted">
                  {activity.organizationName}/{activity.repositoryName} {activity.number}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-skyglass p-6 text-sm font-semibold text-muted">No public activity yet.</p>
        )}
      </section>

      <div className="mt-6">
        <Link href="/profiles" className="text-sm font-semibold text-moss">Back to profiles</Link>
      </div>
    </>
  );
}
