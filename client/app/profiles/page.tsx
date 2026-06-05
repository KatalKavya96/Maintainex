"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageTitle } from "@/components/common/PageTitle";
import { getProfiles } from "@/lib/api";
import type { ProfileSummary } from "@/types/profile";

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getProfiles()
      .then((data) => {
        setProfiles(data);
        setError("");
      })
      .catch((err) => setError(err.message ?? "Failed to load profiles"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageTitle title="Profiles" description="View other Maintainex dashboards in read-only mode." />
      {loading ? <div className="rounded-xl border border-line bg-white p-8 text-sm text-slate-500 shadow-soft">Loading profiles...</div> : null}
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm font-semibold text-red-700">{error}</div> : null}
      {!loading && !error ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => (
            <Link key={profile.id} href={`/profiles/${profile.id}`} className="rounded-xl border border-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-moss/25 hover:shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold text-ink">{profile.name}</h2>
                  <p className="truncate text-sm text-slate-500">{profile.email}</p>
                </div>
                <span className="rounded-lg bg-skyglass px-2 py-1 text-xs font-bold text-moss">{profile.role}</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
                <span className="rounded-lg bg-skyglass p-2 font-semibold text-slate-600">{profile._count.activities} activities</span>
                <span className="rounded-lg bg-skyglass p-2 font-semibold text-slate-600">{profile._count.repositories} repos</span>
                <span className="rounded-lg bg-skyglass p-2 font-semibold text-slate-600">{profile._count.pins} pins</span>
                <span className="rounded-lg bg-skyglass p-2 font-semibold text-slate-600">{profile._count.scheduledWork} tasks</span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </>
  );
}
