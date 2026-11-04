"use client";
import Link from "next/link";
import { ActivityBadge } from "@/features/activities";
import { ActivityHeatmap } from "@/shared/calendar/ActivityHeatmap";
import { formatDate } from "@/shared/lib/dateUtils";
import type { ProfileDashboard } from "@/types/profile";

/** Owner-only workspace summary; public profiles never render personal records. */
export function ProfileWorkspace({ profile, isOwnProfile }: { profile: ProfileDashboard; isOwnProfile: boolean }) {
  const activities = profile.activities;
  const repositories = new Set(activities.map(activity => `${activity.organizationName}/${activity.repositoryName}`));
  const totalContributions = activities.length;
  return (
        <main className="min-w-0 space-y-4">
          {profile.workspaceVisible ? <>
          <section className="min-w-0 rounded-xl border border-line bg-panel p-3 shadow-soft sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-ink">Pinned</h2>
              {isOwnProfile ? <Link href="/pins" className="text-xs font-bold text-moss">Customize pins</Link> : null}
            </div>
            <div className="grid min-w-0 gap-3 md:grid-cols-2">
              {profile.favoritePins.slice(0, 6).map((pin) => (
                <a key={pin.id} href={pin.url} target="_blank" rel="noreferrer" className="rounded-lg border border-line bg-skyglass p-4 transition hover:border-moss">
                  <p className="text-sm font-semibold text-moss">{pin.title}</p>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-muted">{pin.description || pin.url}</p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted">{pin.category.replaceAll("_", " ")}</p>
                </a>
              ))}
              {!profile.favoritePins.length ? <p className="rounded-lg border border-dashed border-line bg-skyglass p-4 text-sm font-semibold text-muted md:col-span-2">No pinned resources yet.</p> : null}
            </div>
          </section>

          <ActivityHeatmap activities={activities} ownerName={profile.user.name} />

          <section className="min-w-0 rounded-xl border border-line bg-panel p-3 shadow-soft sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold text-ink">{totalContributions} loaded activities</h2>
                <p className="text-sm font-semibold text-muted">Contributed to {repositories.size} repositories.</p>
              </div>
              <div className="flex min-w-0 flex-wrap gap-2">
                {Array.from(repositories).slice(0, 3).map((repo) => {
                  const [org, name] = repo.split("/");
                  return (
                    <Link key={repo} href={`/repos/${encodeURIComponent(org)}/${encodeURIComponent(name)}`} className="max-w-full truncate rounded-lg border border-line bg-skyglass px-3 py-1.5 text-xs font-bold text-muted hover:border-moss hover:text-ink">
                      {repo}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3">
              {activities.slice(0, 8).map((activity) => (
                <article key={activity.id} className="rounded-lg border border-line bg-skyglass p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ink">{activity.title}</p>
                      <p className="mt-1 text-sm font-semibold text-muted">
                        <Link href={`/repos/${encodeURIComponent(activity.organizationName)}/${encodeURIComponent(activity.repositoryName)}`} className="hover:text-moss">
                          {activity.organizationName}/{activity.repositoryName}
                        </Link>{" "}
                        · {formatDate(activity.date)}
                      </p>
                    </div>
                    <ActivityBadge value={activity.activityType} />
                  </div>
                </article>
              ))}
              {!activities.length ? <p className="rounded-lg bg-skyglass p-5 text-sm font-semibold text-muted">No public activity yet.</p> : null}
            </div>
          </section>
          </> : <section className="rounded-xl border border-line bg-panel p-5 text-sm text-muted">Workspace activity, saved resources and scheduled work are private.</section>}
        </main>
  );
}
