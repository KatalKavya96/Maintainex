"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/design-system/patterns/Button";
import { Field, Input } from "@/design-system/patterns/FormControls";
import { changePassword } from "@/data/api/profile";
import { useAuthStore } from "@/state/auth";

export default function ChangePasswordPage() {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated. Your next login is ready for the new secret handshake.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not change password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-ink">Change password</h1>
        <p className="mt-1 text-sm font-semibold text-muted">A separate checkpoint for the keys to your Maintainex workspace.</p>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-xl border border-line bg-panel p-5 shadow-soft">
        <Field label="Current password">
          <Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
        </Field>
        <Field label="New password">
          <Input type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
        </Field>
        <Field label="Confirm new password">
          <Input type="password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <Link href={`/profile/${user?.username ?? ""}`} className="text-sm font-bold text-muted hover:text-moss">Back to profile</Link>
          <Button type="submit" disabled={saving}>{saving ? "Updating..." : "Update password"}</Button>
        </div>
        {message ? <p className="rounded-lg bg-skyglass p-3 text-sm font-bold text-muted">{message}</p> : null}
      </form>
    </section>
  );
}
