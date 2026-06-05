"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Field, Input } from "@/components/common/FormControls";
import { useAuthStore } from "@/lib/authStore";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuthStore();
  const [error, setError] = useState("");

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

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md place-items-center">
      <form onSubmit={onSubmit} className="w-full rounded-xl border border-line bg-white p-6 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-moss text-black shadow-[0_12px_24px_rgba(201,244,58,0.22)]">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Sign up</h1>
            <p className="text-sm text-slate-500">First signup becomes admin.</p>
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
            <Input name="password" type="password" required minLength={8} placeholder="At least 8 characters" />
          </Field>
          <Field label="Admin code">
            <Input name="adminCode" placeholder="Optional after first signup" />
          </Field>
        </div>
        {error ? <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}
        <Button type="submit" className="mt-6 w-full">
          Create account
        </Button>
        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-semibold text-moss" href="/login">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
