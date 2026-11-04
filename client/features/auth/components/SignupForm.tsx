"use client";

import { useState } from "react";
import { Button, Field, Input } from "@/design-system";
import { useAuthStore } from "@/state/auth";
import { OAuthButtons } from "./OAuthButtons";

function passwordStrength(password: string) {
  const checks = [password.length >= 8, /[a-z]/.test(password), /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password), password.length >= 12];
  const score = checks.filter(Boolean).length;
  if (!password) return { label: "Start typing", color: "bg-skyglass", width: "5%" };
  if (score <= 2) return { label: "Weak", color: "bg-skyglass", width: "30%" };
  if (score <= 4) return { label: "Good", color: "bg-skyglass", width: "66%" };
  return { label: "Strong", color: "bg-moss", width: "100%" };
}

type Props = { onSuccess: () => void; returnTo?: string; showInvitation?: boolean };

/** Shared by the sign-up page and the in-workspace sign-in dialog. */
export function SignupForm({ onSuccess, returnTo, showInvitation = true }: Props) {
  const { signup } = useAuthStore();
  const [pending, setPending] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const strength = passwordStrength(password);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await signup({
        name: String(form.get("name")),
        email: String(form.get("email")),
        password: String(form.get("password")),
        adminCode: String(form.get("adminCode") ?? "") || undefined
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign up");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
        <Field label="Name">
          <Input name="name" required autoComplete="name" placeholder="Your name" />
        </Field>
        <Field label="Email">
          <Input name="email" autoComplete="email" type="email" required placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <Input name="password" autoComplete="new-password" type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
        </Field>
        <div>
          <div className="h-1.5 overflow-hidden rounded-full bg-skyglass">
            <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: strength.width }} />
          </div>
          <p className="mt-1 text-xs font-bold text-muted">{strength.label}: use uppercase, lowercase, number, and symbol for a stronger password.</p>
        </div>
        {showInvitation ? (
          <Field label="Admin invitation code" hint="Optional, if provided by your workspace administrator.">
            <Input name="adminCode" placeholder="Optional" />
          </Field>
        ) : null}
      </div>
      {error ? <p role="alert" className="mt-4 rounded-lg bg-skyglass px-3 py-2 text-sm font-medium text-danger">{error}</p> : null}
      <Button type="submit" disabled={pending || oauthBusy} className="mt-6 w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <div className="mt-3">
        <OAuthButtons disabled={pending || oauthBusy} returnTo={returnTo} onBusy={setOauthBusy} onError={setError} />
      </div>
    </form>
  );
}
