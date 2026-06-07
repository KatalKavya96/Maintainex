"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Award, BadgeCheck, Code2, ExternalLink, Github, Linkedin, Loader2, Mail, Send, ShieldAlert, Trash2, Users } from "lucide-react";
import { ActivityBadge } from "@/components/activities/ActivityBadge";
import { ActivityHeatmap } from "@/components/calendar/ActivityHeatmap";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/FormControls";
import { getBadges, getProfileByUsername, followUser, resetWorkspaceData, sendEmailVerificationOtp, unfollowUser, verifyEmailOtp } from "@/lib/api";
import { formatDate } from "@/lib/dateUtils";
import { useAuthStore } from "@/lib/authStore";
import type { ProfileDashboard } from "@/types/profile";
import type { Badge } from "@/types/social";

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const { user, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<ProfileDashboard | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [verifyWorking, setVerifyWorking] = useState<"send" | "verify" | "">("");

  const loadProfile = () => {
    setLoading(true);
    Promise.all([getProfileByUsername(params.username), getBadges(params.username)])
      .then(([profileData, badgeData]) => {
        setProfile(profileData);
        setBadges(badgeData);
        setError("");
      })
      .catch((err) => setError(err.message ?? "Failed to load profile"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, [params.username]);

  const activities = useMemo(() => profile?.activities ?? [], [profile]);
  const skills = Array.isArray(profile?.user.skills) ? profile.user.skills : [];
  const mainOrganizations = Array.isArray(profile?.user.mainOrganizations) ? profile.user.mainOrganizations : [];
  const earnedBadges = badges.filter((badge) => badge.earned);
  const visibleBadges = showAllBadges ? badges : (earnedBadges.length ? earnedBadges : badges).slice(0, 5);

  async function toggleFollow() {
    if (!profile) return;
    const action = profile.stats.isFollowing ? unfollowUser : followUser;
    await action(profile.user.id);
    setProfile({
      ...profile,
      stats: {
        ...profile.stats,
        isFollowing: !profile.stats.isFollowing,
        followers: profile.stats.followers + (profile.stats.isFollowing ? -1 : 1)
      }
    });
  }

  async function resetWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResetMessage("");
    try {
      await resetWorkspaceData(password);
      setPassword("");
      setResetOpen(false);
      setResetMessage("Workspace data reset.");
      loadProfile();
      window.dispatchEvent(new Event("maintainex-realtime-dashboard"));
    } catch (err) {
      setResetMessage(err instanceof Error ? err.message : "Reset failed");
    }
  }

  async function sendVerificationCode() {
    setVerifyWorking("send");
    setVerifyMessage("");
    try {
      const data = await sendEmailVerificationOtp();
      setVerifyOpen(true);
      setVerifyMessage(data.message);
    } catch (err) {
      setVerifyMessage(err instanceof Error ? err.message : "Could not send verification code.");
    } finally {
      setVerifyWorking("");
    }
  }

  async function verifyEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVerifyWorking("verify");
    setVerifyMessage("");
    try {
      const data = await verifyEmailOtp(otpCode);
      setProfile((current) => current ? { ...current, user: { ...current.user, emailVerifiedAt: data.user.emailVerifiedAt } } : current);
      updateUser({ emailVerifiedAt: data.user.emailVerifiedAt });
      setOtpCode("");
      setVerifyOpen(false);
      setVerifyMessage("Email verified. Your profile tick is live.");
    } catch (err) {
      setVerifyMessage(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setVerifyWorking("");
    }
  }

  if (loading) return <div className="rounded-xl border border-line bg-white p-8 text-sm text-slate-500 shadow-soft">Loading profile...</div>;
  if (error || !profile) return <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm font-semibold text-red-700">{error || "Profile not found"}</div>;

  const isOwnProfile = user?.id === profile.user.id;
  const repositories = new Set(activities.map((activity) => `${activity.organizationName}/${activity.repositoryName}`));
  const totalContributions = activities.length;

  return (
    <div className="max-w-full space-y-4 overflow-hidden">
      <div className="border-b border-line">
        <div className="flex gap-5 overflow-x-auto text-sm font-semibold text-slate-500">
          <span className="shrink-0 border-b-2 border-moss px-1 pb-3 text-ink">Overview</span>
          {["Activity", "Pins", "Schedule"].map((item) => (
            <Link key={item} href={`/coming-soon?feature=${encodeURIComponent(`Profile ${item}`)}`} className="shrink-0 border-b-2 border-transparent px-1 pb-3 transition hover:border-line hover:text-ink">
              {item}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(220px,260px)_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-3">
          <section className="rounded-xl border border-line bg-white p-3 shadow-soft sm:p-4">
            <div className="relative mx-auto h-28 w-28 rounded-full border border-line bg-skyglass sm:h-32 sm:w-32">
              <div className="grid h-full w-full place-items-center rounded-full bg-moss text-5xl font-black text-black">
                {profile.user.name.slice(0, 1).toUpperCase()}
              </div>
            </div>
            <div className="mt-3 min-w-0 text-center xl:text-left">
              <h1 className="flex min-w-0 items-center justify-center gap-1.5 truncate text-xl font-extrabold text-ink xl:justify-start">
                <span className="truncate">{profile.user.name}</span>
                {profile.user.emailVerifiedAt ? <BadgeCheck size={19} className="shrink-0 text-moss" aria-label="Verified profile" /> : null}
              </h1>
              <p className="flex min-w-0 items-center justify-center gap-1.5 truncate text-sm font-semibold text-slate-500 xl:justify-start">
                <span className="truncate">@{profile.user.username}</span>
                {profile.user.emailVerifiedAt ? <span className="rounded-full bg-moss/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-moss">Verified</span> : null}
              </p>
              <p className="mt-2 text-sm font-semibold leading-5 text-slate-500">{profile.user.bio || "No bio added yet."}</p>
            </div>

            {isOwnProfile ? (
              <div className="mt-3 grid gap-2">
                <Button href="/profile/edit" variant="secondary" className="w-full">Edit profile</Button>
                <Button href="/profile/change-password" variant="ghost" className="w-full">Change password</Button>
              </div>
            ) : (
              <Button type="button" variant={profile.stats.isFollowing ? "secondary" : "primary"} onClick={toggleFollow} className="mt-4 w-full">
                {profile.stats.isFollowing ? "Unfollow" : "Follow"}
              </Button>
            )}

            <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm font-semibold text-slate-500 xl:justify-start">
              <Link href={`/profile/${profile.user.username}/followers`} className="inline-flex items-center gap-1 hover:text-moss">
                <Users size={15} /> <span className="font-bold text-ink">{profile.stats.followers}</span> followers
              </Link>
              <Link href={`/profile/${profile.user.username}/following`} className="hover:text-moss">
                <span className="font-bold text-ink">{profile.stats.following}</span> following
              </Link>
            </div>

            <div className="mt-3 min-w-0 space-y-2 border-t border-line pt-3 text-sm font-semibold text-slate-500">
              <p className="flex min-w-0 items-center gap-2"><Mail size={15} className="shrink-0" /> <span className="truncate">{profile.user.email}</span></p>
              {profile.user.githubUrl ? <a className="flex items-center gap-2 hover:text-moss" href={profile.user.githubUrl} target="_blank" rel="noreferrer"><Github size={15} /> GitHub</a> : null}
              {profile.user.linkedinUrl ? <a className="flex items-center gap-2 hover:text-moss" href={profile.user.linkedinUrl} target="_blank" rel="noreferrer"><Linkedin size={15} /> LinkedIn</a> : null}
              {profile.user.xUrl ? <a className="flex items-center gap-2 hover:text-moss" href={profile.user.xUrl} target="_blank" rel="noreferrer"><span className="text-sm font-black">X</span> X</a> : null}
              {profile.user.leetcodeUrl ? <a className="flex items-center gap-2 hover:text-moss" href={profile.user.leetcodeUrl} target="_blank" rel="noreferrer"><Code2 size={15} /> LeetCode</a> : null}
              {profile.user.portfolioUrl ? <a className="flex items-center gap-2 hover:text-moss" href={profile.user.portfolioUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Portfolio</a> : null}
              <p>Joined {formatDate(profile.user.createdAt.slice(0, 10))}</p>
            </div>

            {isOwnProfile && !profile.user.emailVerifiedAt ? (
              <div className="mt-3 rounded-lg border border-line bg-skyglass p-3">
                <p className="text-sm font-extrabold text-ink">Verify profile</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Get the green tick by verifying the email on your profile.</p>
                <Button type="button" variant="secondary" className="mt-3 w-full" onClick={sendVerificationCode} disabled={Boolean(verifyWorking)}>
                  {verifyWorking === "send" ? <Loader2 className="animate-spin" size={15} /> : <Mail size={15} />}
                  Send OTP
                </Button>
                {verifyOpen ? (
                  <form onSubmit={verifyEmail} className="mt-3 flex gap-2">
                    <Input value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" inputMode="numeric" />
                    <Button type="submit" disabled={verifyWorking === "verify" || otpCode.length !== 6} className="shrink-0">
                      {verifyWorking === "verify" ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />}
                    </Button>
                  </form>
                ) : null}
                {verifyMessage ? <p className="mt-2 text-xs font-bold text-slate-500">{verifyMessage}</p> : null}
              </div>
            ) : null}
            {isOwnProfile && profile.user.emailVerifiedAt ? (
              <p className="mt-3 rounded-lg border border-moss/30 bg-moss/10 px-3 py-2 text-xs font-bold text-moss">Verified with email OTP.</p>
            ) : null}
          </section>

          <section className="rounded-xl border border-line bg-white p-3 shadow-soft sm:p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-ink">Badges</h2>
              <button type="button" onClick={() => setShowAllBadges((value) => !value)} className="text-xs font-bold text-moss">
                {showAllBadges ? "Show less" : "View all"}
              </button>
            </div>
            <div className="mt-3 grid gap-2">
              {visibleBadges.map((badge) => (
                <div key={badge.name} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${badge.earned ? "border-moss/40 bg-skyglass text-ink" : "border-line bg-skyglass text-slate-500 opacity-70"}`}>
                  <Award size={16} className={badge.earned ? "text-moss" : "text-slate-500"} />
                  {badge.name}
                </div>
              ))}
              {!badges.length ? <p className="text-sm font-semibold text-slate-500">No badges yet.</p> : null}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white p-3 shadow-soft sm:p-4">
            <h2 className="font-extrabold text-ink">Organizations</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {mainOrganizations.map((org) => (
                <Link key={org} href={`/orgs/${encodeURIComponent(org)}`} className="rounded-lg border border-line bg-skyglass px-3 py-1.5 text-sm font-bold text-slate-500 hover:border-moss hover:text-ink">
                  {org}
                </Link>
              ))}
              {!mainOrganizations.length ? <p className="text-sm font-semibold text-slate-500">No organizations listed.</p> : null}
            </div>
          </section>

          {isOwnProfile ? (
            <section className="rounded-xl border border-red-500/30 bg-white p-3 shadow-soft sm:p-4">
              <button type="button" onClick={() => setResetOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 text-left">
                <span>
                  <span className="flex items-center gap-2 text-sm font-extrabold text-red-300"><ShieldAlert size={16} /> Danger zone</span>
                  <span className="mt-1 block text-xs font-semibold text-slate-500">Reset workspace data with your password.</span>
                </span>
              </button>
              {resetOpen ? (
                <form onSubmit={resetWorkspace} className="mt-4 space-y-3">
                  <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Confirm password" required />
                  <button type="submit" className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-500 px-3 text-sm font-bold text-white transition hover:bg-red-400">
                    <Trash2 size={15} /> Reset data
                  </button>
                </form>
              ) : null}
              {resetMessage ? <p className="mt-3 text-xs font-bold text-slate-500">{resetMessage}</p> : null}
            </section>
          ) : null}
        </aside>

        <main className="min-w-0 space-y-4">
          <section className="min-w-0 rounded-xl border border-line bg-white p-3 shadow-soft sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-extrabold text-ink">Pinned</h2>
              {isOwnProfile ? <Link href="/pins" className="text-xs font-bold text-moss">Customize pins</Link> : null}
            </div>
            <div className="grid min-w-0 gap-3 md:grid-cols-2">
              {profile.favoritePins.slice(0, 6).map((pin) => (
                <a key={pin.id} href={pin.url} target="_blank" rel="noreferrer" className="rounded-lg border border-line bg-skyglass p-4 transition hover:border-moss">
                  <p className="text-sm font-extrabold text-moss">{pin.title}</p>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">{pin.description || pin.url}</p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">{pin.category.replaceAll("_", " ")}</p>
                </a>
              ))}
              {!profile.favoritePins.length ? <p className="rounded-lg border border-dashed border-line bg-skyglass p-4 text-sm font-semibold text-slate-500 md:col-span-2">No pinned resources yet.</p> : null}
            </div>
          </section>

          <ActivityHeatmap activities={activities} ownerName={profile.user.name} />

          <section className="min-w-0 rounded-xl border border-line bg-white p-3 shadow-soft sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-extrabold text-ink">{totalContributions} contributions in the last year</h2>
                <p className="text-sm font-semibold text-slate-500">Contributed to {repositories.size} repositories.</p>
              </div>
              <div className="flex min-w-0 flex-wrap gap-2">
                {Array.from(repositories).slice(0, 3).map((repo) => {
                  const [org, name] = repo.split("/");
                  return (
                    <Link key={repo} href={`/repos/${encodeURIComponent(org)}/${encodeURIComponent(name)}`} className="max-w-full truncate rounded-lg border border-line bg-skyglass px-3 py-1.5 text-xs font-bold text-slate-500 hover:border-moss hover:text-ink">
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
                      <p className="mt-1 text-sm font-semibold text-slate-500">
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
              {!activities.length ? <p className="rounded-lg bg-skyglass p-5 text-sm font-semibold text-slate-500">No public activity yet.</p> : null}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
