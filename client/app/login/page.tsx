"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Github, ShieldCheck } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Field, Input } from "@/components/common/FormControls";
import { getOAuthUrl } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, viewAsViewer, completeOAuthSession } = useAuthStore();
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
    if (oauthCode) {
      completeOAuthSession(oauthCode)
        .then(() => router.replace("/"))
        .catch((err) => setError(err instanceof Error ? err.message : "OAuth login failed."))
        .finally(() => window.history.replaceState(null, "", "/login"));
    }
  }, [completeOAuthSession, router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await login(String(form.get("email")), String(form.get("password")));
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to login");
    }
  }

  async function enterViewerMode() {
    setError("");
    try {
      await viewAsViewer();
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start viewer mode");
    }
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
      <form onSubmit={onSubmit} className="w-full rounded-xl border border-line bg-white p-6 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-moss text-black shadow-[0_12px_24px_rgba(201,244,58,0.22)]">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Login</h1>
            <p className="text-sm text-slate-500">Manage Maintainex securely.</p>
          </div>
        </div>
        <div className="space-y-4">
          <Field label="Email">
            <Input name="email" type="email" required placeholder="you@example.com" />
          </Field>
          <Field label="Password">
            <Input name="password" type="password" required placeholder="Password" />
          </Field>
        </div>
        {error ? <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}
        <div className="mt-6 space-y-3">
          <Button type="submit" className="w-full">
            Login
          </Button>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="secondary" className="w-full" onClick={() => continueWith("google")} disabled={Boolean(oauthLoading)}>
              <span className="font-black">G</span>
              {oauthLoading === "google" ? "Opening..." : "Google"}
            </Button>
            <Button type="button" variant="secondary" className="w-full" onClick={() => continueWith("github")} disabled={Boolean(oauthLoading)}>
              <Github size={16} />
              {oauthLoading === "github" ? "Opening..." : "GitHub"}
            </Button>
          </div>
          <Button type="button" variant="secondary" className="w-full" onClick={enterViewerMode}>
            View as viewer
          </Button>
        </div>
        <p className="mt-5 text-center text-sm text-slate-600">
          Need an account?{" "}
          <Link className="font-semibold text-moss" href="/signup">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
