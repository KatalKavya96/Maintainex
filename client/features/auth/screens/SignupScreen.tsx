"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { SignupForm } from "../components/SignupForm";

export default function SignupPage() {
  const router = useRouter();

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md place-items-center">
      <div className="w-full rounded-xl border border-line bg-panel p-6 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-moss text-on-accent ">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Sign up</h1>
            <p className="text-sm text-muted">Create your contribution workspace.</p>
          </div>
        </div>
        <SignupForm onSuccess={() => router.replace("/dashboard")} />
        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link className="font-semibold text-moss" href="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
