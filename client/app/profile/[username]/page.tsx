"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Users } from "lucide-react";
import { ActivityLineChart, ActivityTypeChart, OrgChart, RepoChart } from "@/components/analytics/Charts";
import { ActivityHeatmap } from "@/components/calendar/ActivityHeatmap";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { getBadges, getProfileByUsername, followUser, unfollowUser } from "@/lib/api";
import { formatDate } from "@/lib/dateUtils";
import { useAuthStore } from "@/lib/authStore";
import type { ProfileDashboard } from "@/types/profile";
import type { Badge } from "@/types/social";

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ProfileDashboard | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getProfileByUsername(params.username), getBadges(params.username)])
      .then(([profileData, badgeData]) => {
        setProfile(profileData);
        setBadges(badgeData);
        setError("");
      })
      .catch((err) => setError(err.message ?? "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [params.username]);

  const activities = useMemo(() => profile?.activities ?? [], [profile]);
  const skills = Array.isArray(profile?.user.skills) ? profile.user.skills : [];
  const mainOrganizations = Array.isArray(profile?.user.mainOrganizations) ? profile.user.mainOrganizations : [];
  const earnedBadges = badges.filter((badge) => badge.earned);

  async function toggleFollow() {
    if (!profile) return;
    const action = profile.stats.isFollowing ? unfollowUser : followUser;
    await action(profile.user.id);
    setProfile({ ...profile, stats: { ...profile.stats, isFollowing: !profile.stats.isFollowing, followers: profile.stats.followers + (profile.stats.isFollowing ? -1 : 1) } });
  }

  if (loading) return <div className="rounded-xl border border-line bg-white p-8 text-sm text-slate-500 shadow-soft">Loading profile...</div>;
  if (error || !profile) return <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm font-semibold text-red-700">{error || "Profile not found"}</div>;

  const isOwnProfile = user?.id === profile.user.id;

  return (
    <>
      <PageTitle
        title={`${profile.user.name}'s Profile`}
        description={`@${profile.user.username} on Maintainex`}
        action={!isOwnProfile ? <Button type="button" onClick={toggleFollow}>{profile.stats.isFollowing ? "Unfollow" : "Follow"}</Button> : undefined}
      />

      <section className="rounded-2xl border border-line bg-white p-6 shadow-soft">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <div>
            <p className="text-lg font-semibold leading-8 text-slate-500">{profile.user.bio || "No bio added yet."}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className="rounded-lg bg-skyglass px-3 py-2 text-sm font-bold text-moss">{skill}</span>
              ))}
              {mainOrganizations.map((org) => (
                <span key={org} className="rounded-lg border border-line px-3 py-2 text-sm font-bold text-slate-500">{org}</span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {profile.user.githubUrl ? <a className="inline-flex items-center gap-2 text-sm font-bold text-moss" href={profile.user.githubUrl} target="_blank" rel="noreferrer">GitHub <ExternalLink size={14} /></a> : null}
              {profile.user.linkedinUrl ? <a className="inline-flex items-center gap-2 text-sm font-bold text-moss" href={profile.user.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn <ExternalLink size={14} /></a> : null}
              {profile.user.portfolioUrl ? <a className="inline-flex items-center gap-2 text-sm font-bold text-moss" href={profile.user.portfolioUrl} target="_blank" rel="noreferrer">Portfolio <ExternalLink size={14} /></a> : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["PRs Raised", activities.filter((item) => item.activityType === "PR_RAISED").length],
              ["PRs Reviewed", activities.filter((item) => item.activityType === "PR_REVIEWED").length],
              ["Issues Raised", activities.filter((item) => item.activityType === "ISSUE_RAISED").length],
              ["Issues Closed", activities.filter((item) => item.activityType === "ISSUE_CLOSED").length],
              ["Repos", profile.stats.repositories],
              ["Followers", profile.stats.followers]
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-line bg-skyglass p-4">
                <p className="text-2xl font-extrabold text-moss">{value}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5 text-sm font-bold text-slate-500">
          <span>Joined {formatDate(profile.user.createdAt.slice(0, 10))}</span>
          <Link className="inline-flex items-center gap-2 text-moss" href={`/profile/${profile.user.username}/followers`}><Users size={15} /> {profile.stats.followers} followers</Link>
          <Link className="text-moss" href={`/profile/${profile.user.username}/following`}>{profile.stats.following} following</Link>
        </div>
      </section>

      <div className="mt-6">
        <ActivityHeatmap activities={activities} ownerName={profile.user.name} />
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight">Badges earned</h2>
          <Link href="/badges" className="text-sm font-bold text-moss">View all</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {(earnedBadges.length ? earnedBadges : badges.slice(0, 4)).map((badge) => (
            <span key={badge.name} className={`rounded-lg px-3 py-2 text-sm font-bold ${badge.earned ? "bg-moss text-black" : "bg-skyglass text-slate-500"}`}>{badge.name}</span>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ActivityLineChart activities={activities} />
        <ActivityTypeChart activities={activities} />
        <RepoChart activities={activities} />
        <OrgChart activities={activities} />
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-xl font-extrabold tracking-tight">Recent public activity</h2>
        <div className="space-y-3">
          {activities.slice(0, 8).map((activity) => (
            <article key={activity.id} className="rounded-xl border border-line bg-skyglass p-4">
              <p className="font-bold text-ink">{activity.title}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">{activity.organizationName}/{activity.repositoryName} · {formatDate(activity.date)}</p>
            </article>
          ))}
          {!activities.length ? <p className="rounded-xl bg-skyglass p-5 text-sm font-semibold text-slate-500">No public activity yet.</p> : null}
        </div>
      </section>
    </>
  );
}
