"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Field, Input, Textarea } from "@/components/common/FormControls";
import { checkUsernameAvailability, getProfileByUsername, updateProfile } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import type { ProfileUpdateInput, UsernameAvailability } from "@/types/profile";

const csvToList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
const listToCsv = (value?: string[] | null) => Array.isArray(value) ? value.join(", ") : "";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState<ProfileUpdateInput>({});
  const [skillsText, setSkillsText] = useState("");
  const [orgsText, setOrgsText] = useState("");
  const [availability, setAvailability] = useState<UsernameAvailability | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user?.username) return;
    getProfileByUsername(user.username).then((profile) => {
      setForm({
        name: profile.user.name,
        username: profile.user.username,
        bio: profile.user.bio ?? "",
        githubUrl: profile.user.githubUrl ?? "",
        linkedinUrl: profile.user.linkedinUrl ?? "",
        xUrl: profile.user.xUrl ?? "",
        leetcodeUrl: profile.user.leetcodeUrl ?? "",
        portfolioUrl: profile.user.portfolioUrl ?? ""
      });
      setSkillsText(listToCsv(profile.user.skills));
      setOrgsText(listToCsv(profile.user.mainOrganizations));
    }).catch(() => setMessage("Could not load profile details."));
  }, [user?.username]);

  const username = useMemo(() => form.username?.trim() ?? "", [form.username]);

  useEffect(() => {
    if (!username || username.length < 3) {
      setAvailability(null);
      return;
    }
    const timeout = window.setTimeout(() => {
      checkUsernameAvailability(username).then(setAvailability).catch(() => setAvailability(null));
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [username]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const updated = await updateProfile({
        ...form,
        skills: csvToList(skillsText),
        mainOrganizations: csvToList(orgsText)
      });
      updateUser({ name: updated.name, username: updated.username, email: updated.email, role: updated.role });
      setMessage("Profile updated.");
      router.replace(`/profile/${updated.username}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  const availableState = availability?.available && availability.canChange;

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-ink">Edit profile</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">Update your public Maintainex identity and social links.</p>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-xl border border-line bg-white p-5 shadow-soft">
        <Field label="Display name">
          <Input value={form.name ?? ""} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </Field>
        <Field label="Username">
          <Input value={form.username ?? ""} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
          {availability ? (
            <p className={`mt-2 flex items-center gap-2 text-xs font-bold ${availableState || availability.message.includes("current") ? "text-moss" : "text-red-400"}`}>
              {availableState || availability.message.includes("current") ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {availability.message}
            </p>
          ) : <p className="mt-2 text-xs font-semibold text-slate-500">Username can be changed once every 30 days.</p>}
        </Field>
        <Field label="Bio">
          <Textarea value={form.bio ?? ""} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="What are you building or maintaining?" />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="GitHub URL">
            <Input value={form.githubUrl ?? ""} onChange={(event) => setForm({ ...form, githubUrl: event.target.value })} placeholder="https://github.com/username" />
          </Field>
          <Field label="LinkedIn URL">
            <Input value={form.linkedinUrl ?? ""} onChange={(event) => setForm({ ...form, linkedinUrl: event.target.value })} placeholder="https://linkedin.com/in/username" />
          </Field>
          <Field label="X URL">
            <Input value={form.xUrl ?? ""} onChange={(event) => setForm({ ...form, xUrl: event.target.value })} placeholder="https://x.com/username" />
          </Field>
          <Field label="LeetCode URL">
            <Input value={form.leetcodeUrl ?? ""} onChange={(event) => setForm({ ...form, leetcodeUrl: event.target.value })} placeholder="https://leetcode.com/u/username" />
          </Field>
          <Field label="Portfolio URL">
            <Input value={form.portfolioUrl ?? ""} onChange={(event) => setForm({ ...form, portfolioUrl: event.target.value })} placeholder="https://your.site" />
          </Field>
        </div>
        <Field label="Skills">
          <Input value={skillsText} onChange={(event) => setSkillsText(event.target.value)} placeholder="React, TypeScript, Prisma" />
        </Field>
        <Field label="Organizations">
          <Input value={orgsText} onChange={(event) => setOrgsText(event.target.value)} placeholder="maintainex, apache, vercel" />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <Button href={`/profile/${user?.username ?? ""}`} variant="secondary">Cancel</Button>
          <div className="flex items-center gap-3">
            {message ? <p className="text-sm font-bold text-slate-500">{message}</p> : null}
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save profile"}</Button>
          </div>
        </div>
      </form>
    </section>
  );
}
