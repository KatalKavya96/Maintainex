"use client";

import { useState, type ReactNode } from "react";
import { Button, Field, Input } from "@/design-system";
import { useAuthStore } from "@/state/auth";
import { OAuthButtons } from "./OAuthButtons";

type Props = { onSuccess: () => void; returnTo?: string; initialError?: string; footer?: ReactNode };

/** Shared by the login page and the in-workspace sign-in dialog. */
export function LoginForm({ onSuccess, returnTo, initialError = "", footer }: Props) {
  const { login } = useAuthStore();
  const [pending, setPending] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [error, setError] = useState(initialError);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await login(String(form.get("email")), String(form.get("password")));
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setPending(false);
    }
  }

  const busy = pending || oauthBusy;
  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
        <Field label="Email">
          <Input name="email" autoComplete="email" type="email" required placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <Input name="password" autoComplete="current-password" type="password" required placeholder="Password" />
        </Field>
      </div>
      {error ? <p role="alert" className="mt-4 rounded-lg bg-skyglass px-3 py-2 text-sm font-medium text-danger">{error}</p> : null}
      <div className="mt-6 space-y-3">
        <Button type="submit" disabled={busy} className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
        <OAuthButtons disabled={busy} returnTo={returnTo} onBusy={setOauthBusy} onError={setError} />
        {footer}
      </div>
    </form>
  );
}
