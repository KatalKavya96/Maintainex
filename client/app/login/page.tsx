"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Field, Input } from "@/components/common/FormControls";
import { useAuthStore } from "@/lib/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, viewAsViewer } = useAuthStore();
  const [error, setError] = useState("");

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
