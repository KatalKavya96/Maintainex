"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button, Surface } from "@/design-system";
import { logoutEverywhere } from "@/data/api/auth";
import { useAuthStore } from "@/state/auth";

export function SessionsPanel() {
  const router = useRouter();
  const { logout, isViewer } = useAuthStore();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (isViewer) return null;

  async function signOutEverywhere() {
    setBusy(true);
    setError("");
    try {
      await logoutEverywhere();
      logout();
      router.replace("/login");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign out other devices.");
      setBusy(false);
    }
  }

  return (
    <Surface className="mb-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <LogOut size={20} className="mt-1 text-muted" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-medium">Sessions</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Lost a device or used a shared computer? Sign out everywhere, including here.</p>
          </div>
        </div>
        {confirming ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="danger" size="sm" disabled={busy} onClick={() => void signOutEverywhere()}>{busy ? "Signing out…" : "Sign out everywhere"}</Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirming(false)}>Cancel</Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setConfirming(true)}>Sign out of all devices</Button>
        )}
      </div>
      {error ? <p role="alert" className="mt-4 text-sm text-danger">{error}</p> : null}
    </Surface>
  );
}
