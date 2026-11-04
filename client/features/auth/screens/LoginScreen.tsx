"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/design-system/patterns/Button";
import { Field, Input } from "@/design-system/patterns/FormControls";
import { takeOAuthFlow } from "@/data/oauthFlow";
import { workspaceDestination } from "@/shared/lib/routes";
import { useAuthStore } from "@/state/auth";
import { OAuthButtons } from "../components/OAuthButtons";

const requestedDestination = () => workspaceDestination(new URLSearchParams(window.location.search).get("returnTo"));

export default function LoginPage() {
  const router = useRouter();
  const { login, viewAsViewer, completeOAuthSession } = useAuthStore();
  const oauthStarted = useRef(false);
  const [pending, setPending] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("oauthError");
    const oauthCode = params.get("oauthCode");
    if (!oauthError && !oauthCode) return;
    window.history.replaceState(null, "", "/login");
    if (oauthError) {
      takeOAuthFlow("login");
      setError(oauthError);
      return;
    }
    if (!oauthCode || oauthStarted.current) return;
    oauthStarted.current = true;
    const pendingFlow = takeOAuthFlow("login");
    if (!pendingFlow) {
      setError("This sign-in was started in a different tab or browser. Please start again here.");
      return;
    }
    setCompleting(true);
    completeOAuthSession(oauthCode, pendingFlow.nonce)
      .then(() => router.replace(workspaceDestination(pendingFlow.returnTo ?? null)))
      .catch((err) => {
        setCompleting(false);
        setError(err instanceof Error ? err.message : "Sign-in could not be completed. Please try again.");
      });
  }, [completeOAuthSession, router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await login(String(form.get("email")), String(form.get("password")));
      router.replace(requestedDestination());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally { setPending(false); }
  }

  async function enterViewerMode() {
    if (pending) return;
    setError("");
    setPending(true);
    try {
      await viewAsViewer();
      router.replace(requestedDestination());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start viewer mode");
    } finally { setPending(false); }
  }

  if (completing) {
    return (
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md place-items-center">
        <div role="status" className="w-full rounded-xl border border-line bg-panel p-8 text-center shadow-soft">
          <ShieldCheck size={28} className="mx-auto text-moss" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-semibold">Finishing sign-in…</h1>
          <p className="mt-2 text-sm text-muted">Opening your workspace.</p>
        </div>
      </div>
    );
  }

  const busy = pending || oauthBusy;
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md place-items-center">
      <form onSubmit={onSubmit} className="w-full rounded-xl border border-line bg-panel p-6 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-moss text-on-accent ">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted">Continue your contribution practice.</p>
          </div>
        </div>
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
          <OAuthButtons disabled={busy} returnTo={new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("returnTo") ?? undefined} onBusy={setOauthBusy} onError={setError} />
          <Button type="button" variant="secondary" className="w-full" onClick={enterViewerMode} disabled={busy}>
            View as viewer
          </Button>
        </div>
        <p className="mt-5 text-center text-sm text-muted"><Link href="/" className="text-moss">← Explore Maintainex</Link></p>
        <p className="mt-5 text-center text-sm text-muted">
          Need an account?{" "}
          <Link className="font-semibold text-moss" href="/signup">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
