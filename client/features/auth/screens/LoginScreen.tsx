"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/design-system";
import { takeOAuthFlow } from "@/data/oauthFlow";
import { workspaceDestination } from "@/shared/lib/routes";
import { useAuthStore } from "@/state/auth";
import { LoginForm } from "../components/LoginForm";

const requestedReturn = () => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("returnTo"));

export default function LoginPage() {
  const router = useRouter();
  const { viewAsViewer, completeOAuthSession } = useAuthStore();
  const oauthStarted = useRef(false);
  const [returnTo] = useState(requestedReturn);
  const [viewerPending, setViewerPending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("oauthError");
    const oauthCode = params.get("oauthCode");
    if (!oauthError && !oauthCode) return;
    window.history.replaceState(null, "", "/login");
    if (oauthError) {
      takeOAuthFlow("login");
      setPageError(oauthError);
      return;
    }
    if (!oauthCode || oauthStarted.current) return;
    oauthStarted.current = true;
    const pendingFlow = takeOAuthFlow("login");
    if (!pendingFlow) {
      setPageError("This sign-in was started in a different tab or browser. Please start again here.");
      return;
    }
    setCompleting(true);
    completeOAuthSession(oauthCode, pendingFlow.nonce)
      .then(() => router.replace(workspaceDestination(pendingFlow.returnTo ?? null)))
      .catch((err) => {
        setCompleting(false);
        setPageError(err instanceof Error ? err.message : "Sign-in could not be completed. Please try again.");
      });
  }, [completeOAuthSession, router]);

  async function enterViewerMode() {
    if (viewerPending) return;
    setViewerPending(true);
    try {
      await viewAsViewer();
      router.replace(workspaceDestination(returnTo));
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Unable to start viewer mode");
      setViewerPending(false);
    }
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

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md place-items-center">
      <div className="w-full rounded-xl border border-line bg-panel p-6 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-moss text-on-accent ">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted">Continue your contribution practice.</p>
          </div>
        </div>
        <LoginForm
          key={pageError}
          initialError={pageError}
          returnTo={returnTo ?? undefined}
          onSuccess={() => router.replace(workspaceDestination(returnTo))}
          footer={<Button type="button" variant="secondary" className="w-full" onClick={enterViewerMode} disabled={viewerPending}>View as viewer</Button>}
        />
        <p className="mt-5 text-center text-sm text-muted"><Link href="/" className="text-moss">← Explore Maintainex</Link></p>
        <p className="mt-5 text-center text-sm text-muted">
          Need an account?{" "}
          <Link className="font-semibold text-moss" href="/signup">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
