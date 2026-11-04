"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Dialog } from "@/design-system";
import { signInRequiredEvent, type SignInRequiredDetail } from "@/data/http";
import { useAuthStore } from "@/state/auth";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

type Mode = "login" | "signup";

/** Answers SIGN_IN_REQUIRED from the API (or a button) with an in-place sign-in, so viewers keep their page. */
export function SignInDialog() {
  const pathname = usePathname();
  const { isViewer } = useAuthStore();
  const [prompt, setPrompt] = useState<SignInRequiredDetail | null>(null);
  const [mode, setMode] = useState<Mode>("login");

  useEffect(() => {
    if (!isViewer) {
      setPrompt(null);
      return;
    }
    const open = (event: Event) => {
      const detail = (event as CustomEvent<SignInRequiredDetail>).detail;
      setPrompt((current) => current ?? detail);
    };
    window.addEventListener(signInRequiredEvent, open);
    return () => window.removeEventListener(signInRequiredEvent, open);
  }, [isViewer]);

  function finished() {
    // A blocked page view was loaded as the viewer, so refetch it as the new account; a blocked action keeps the page and its input.
    const reload = prompt?.reason === "view";
    setPrompt(null);
    if (reload) window.location.reload();
  }

  const tab = (value: Mode, label: string) => (
    <button
      type="button"
      aria-pressed={mode === value}
      onClick={() => setMode(value)}
      className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${mode === value ? "bg-panel text-ink shadow-soft" : "text-muted hover:text-ink"}`}
    >
      {label}
    </button>
  );

  return (
    <Dialog
      open={Boolean(prompt)}
      title={mode === "login" ? "Sign in to continue" : "Create your account"}
      description={prompt?.message}
      onClose={() => setPrompt(null)}
    >
      <div role="group" aria-label="Account" className="my-5 flex gap-1 rounded-lg border border-line bg-skyglass p-1">
        {tab("login", "Sign in")}
        {tab("signup", "Create account")}
      </div>
      {mode === "login" ? (
        <LoginForm onSuccess={finished} returnTo={pathname} />
      ) : (
        <SignupForm onSuccess={finished} returnTo={pathname} showInvitation={false} />
      )}
      <p className="mt-4 text-center text-xs text-muted">You will stay on this page.</p>
    </Dialog>
  );
}
