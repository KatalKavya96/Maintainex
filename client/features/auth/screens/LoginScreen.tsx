"use client";

import Link from "next/link";
import { workspaceDestination } from "@/shared/lib/routes";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Github, ShieldCheck } from "lucide-react";
import { Button } from "@/design-system/patterns/Button";
import { Field, Input } from "@/design-system/patterns/FormControls";
import { getOAuthUrl } from "@/data/api/auth";
import { useAuthStore } from "@/state/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, viewAsViewer, completeOAuthSession } = useAuthStore();
  const oauthStarted = useRef(false);
  const [pending, setPending] = useState(false);
  const destination = () => workspaceDestination(new URLSearchParams(window.location.search).get("returnTo"));
  const [error, setError] = useState("");
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | "">("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("oauthError");
    const oauthCode = params.get("oauthCode");
    if (oauthError) {
      setError(oauthError);
      window.history.replaceState(null, "", "/login");
      return;
    }
    if (oauthCode && !oauthStarted.current) {
      oauthStarted.current = true;
      window.history.replaceState(null, "", `/login?returnTo=${encodeURIComponent(destination())}`);
      completeOAuthSession(oauthCode)
        .then(() => router.replace(destination()))
        .catch((err) => setError(err instanceof Error ? err.message : "OAuth login failed."))
        ;
    }
  }, [completeOAuthSession, router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await login(String(form.get("email")), String(form.get("password")));
      router.replace(destination());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to login");
    } finally { setPending(false); }
  }

  async function enterViewerMode() {
    setError("");
    if (pending) return;
    setPending(true);
    try {
      await viewAsViewer();
      router.replace(destination());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start viewer mode");
    } finally { setPending(false); }
  }

  async function continueWith(provider: "google" | "github") {
    setOauthLoading(provider);
    setError("");
    try {
      const data = await getOAuthUrl(provider);
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} login is not available.`);
      setOauthLoading("");
    }
  }

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
          <Button type="submit" disabled={pending || Boolean(oauthLoading)} className="w-full">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="secondary" className="w-full" onClick={() => continueWith("google")} disabled={pending || Boolean(oauthLoading)}>
              <span className="font-semibold">G</span>
              {oauthLoading === "google" ? "Opening..." : "Google"}
            </Button>
            <Button type="button" variant="secondary" className="w-full" onClick={() => continueWith("github")} disabled={pending || Boolean(oauthLoading)}>
              <Github size={16} />
              {oauthLoading === "github" ? "Opening..." : "GitHub"}
            </Button>
          </div>
          <Button type="button" variant="secondary" className="w-full" onClick={enterViewerMode} disabled={pending || Boolean(oauthLoading)}>
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
