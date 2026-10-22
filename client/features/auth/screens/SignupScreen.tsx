"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Github, ShieldCheck } from "lucide-react";
import { Button } from "@/design-system/patterns/Button";
import { Field, Input } from "@/design-system/patterns/FormControls";
import { getOAuthUrl } from "@/data/api/auth";
import { useAuthStore } from "@/state/auth";

function passwordStrength(password: string) {
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
    password.length >= 12
  ];
  const score = checks.filter(Boolean).length;
  if (!password) return { score: 0, label: "Start typing", color: "bg-skyglass", width: "5%" };
  if (score <= 2) return { score, label: "Weak", color: "bg-skyglass", width: "30%" };
  if (score <= 4) return { score, label: "Good", color: "bg-skyglass", width: "66%" };
  return { score, label: "Strong", color: "bg-moss", width: "100%" };
}

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuthStore();
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | "">("");
  const strength = passwordStrength(password);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await signup({
        name: String(form.get("name")),
        email: String(form.get("email")),
        password: String(form.get("password")),
        adminCode: String(form.get("adminCode") ?? "") || undefined
      });
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign up");
    }
  }

  async function continueWith(provider: "google" | "github") {
    setOauthLoading(provider);
    setError("");
    try {
      const data = await getOAuthUrl(provider);
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} signup is not available.`);
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
            <h1 className="text-2xl font-bold">Sign up</h1>
            <p className="text-sm text-muted">First signup becomes admin.</p>
          </div>
        </div>
        <div className="space-y-4">
          <Field label="Name">
            <Input name="name" required placeholder="Your name" />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" required placeholder="you@example.com" />
          </Field>
          <Field label="Password">
            <Input name="password" type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-skyglass">
                <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: strength.width }} />
              </div>
              <p className="mt-1 text-xs font-bold text-muted">{strength.label}: use uppercase, lowercase, number, and symbol for a stronger password.</p>
            </div>
          </Field>
          <Field label="Admin code">
            <Input name="adminCode" placeholder="Optional after first signup" />
          </Field>
        </div>
        {error ? <p className="mt-4 rounded-lg bg-skyglass px-3 py-2 text-sm font-medium text-danger">{error}</p> : null}
        <Button type="submit" className="mt-6 w-full">
          Create account
        </Button>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="secondary" className="w-full" onClick={() => continueWith("google")} disabled={Boolean(oauthLoading)}>
            <span className="font-semibold">G</span>
            {oauthLoading === "google" ? "Opening..." : "Google"}
          </Button>
          <Button type="button" variant="secondary" className="w-full" onClick={() => continueWith("github")} disabled={Boolean(oauthLoading)}>
            <Github size={16} />
            {oauthLoading === "github" ? "Opening..." : "GitHub"}
          </Button>
        </div>
        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link className="font-semibold text-moss" href="/login">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
