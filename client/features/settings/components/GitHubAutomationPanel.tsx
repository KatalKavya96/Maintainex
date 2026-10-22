"use client";

import { useEffect, useState } from "react";
import { Github, Loader2, RefreshCw, ShieldCheck, Unplug } from "lucide-react";
import { Button } from "@/design-system/patterns/Button";
import { disconnectGitHub, getGitHubOAuthUrl, getGitHubStatus, syncGitHub } from "@/data/api/github";
import { useAuthStore } from "@/state/auth";
import type { GitHubStatus, GitHubSyncResult } from "@/types/github";

function formatDate(value?: string | null) {
  if (!value) return "Never synced";
  return new Date(value).toLocaleString();
}

export function GitHubAutomationPanel() {
  const { isViewer } = useAuthStore();
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [syncResult, setSyncResult] = useState<GitHubSyncResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  async function loadStatus() {
    setLoading(true);
    setMessage("");
    try {
      setStatus(await getGitHubStatus());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load GitHub status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const github = searchParams.get("github");
    const login = searchParams.get("login");
    const error = searchParams.get("message");
    if (github === "connected") {
      setMessage(login ? `GitHub connected as @${login}. You can sync now.` : "GitHub connected. You can sync now.");
    }
    if (github === "error") {
      setMessage(error ?? "GitHub connection failed.");
    }
  }, []);

  async function connect() {
    if (isViewer) {
      setMessage("Sign in with a real account before connecting GitHub.");
      return;
    }
    setWorking(true);
    setMessage("");
    try {
      const data = await getGitHubOAuthUrl();
      window.location.href = data.url;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "GitHub OAuth is not ready.");
      setWorking(false);
    }
  }

  async function runSync() {
    if (isViewer) {
      setMessage("Sign in with a real account before syncing GitHub.");
      return;
    }
    setWorking(true);
    setMessage("");
    try {
      const result = await syncGitHub();
      setSyncResult(result);
      await loadStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "GitHub sync failed.");
    } finally {
      setWorking(false);
    }
  }

  async function disconnect() {
    if (isViewer) {
      setMessage("Sign in with a real account before changing GitHub connection.");
      return;
    }
    setWorking(true);
    setMessage("");
    try {
      await disconnectGitHub();
      setSyncResult(null);
      await loadStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to disconnect GitHub.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="mb-4 rounded-xl border border-line bg-panel p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-skyglass text-moss">
            <Github size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">GitHub automation</h2>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-muted">
              OAuth sync imports only contribution-related repositories, PRs, reviews, issues, comments, and assigned issues. Synced rows stay separate from manual data.
            </p>
          </div>
        </div>
        {loading ? (
          <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-skyglass px-3 text-sm font-bold text-muted">
            <Loader2 className="animate-spin" size={16} />
            Checking
          </span>
        ) : status?.connected ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={runSync} disabled={working}>
              {working ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Sync now
            </Button>
            <Button type="button" variant="ghost" onClick={disconnect} disabled={working}>
              <Unplug size={16} />
              Disconnect
            </Button>
          </div>
        ) : (
          <Button type="button" onClick={connect} disabled={working || !status?.configAvailable || isViewer}>
            {working ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
            {isViewer ? "Sign in to connect" : "Connect GitHub"}
          </Button>
        )}
      </div>

      <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
        <div className="rounded-lg border border-line bg-skyglass p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Connection</p>
          <p className="mt-1 font-semibold text-ink">{status?.connected ? `@${status.login}` : isViewer ? "Sign in required" : status?.configAvailable ? "Ready to connect" : "OAuth env missing"}</p>
        </div>
        <div className="rounded-lg border border-line bg-skyglass p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Last sync</p>
          <p className="mt-1 font-semibold text-ink">{formatDate(status?.lastSyncedAt)}</p>
        </div>
        <div className="rounded-lg border border-line bg-skyglass p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Token storage</p>
          <p className="mt-1 font-semibold text-ink">{status?.tokenEncryptionConfigured ? "Encryption key set" : "Needs secret key"}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 text-sm lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-lg border border-line bg-skyglass p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Callback URL</p>
          <p className="mt-1 break-all font-semibold text-ink">{status?.redirectUri ?? "Checking..."}</p>
        </div>
        <div className="rounded-lg border border-line bg-skyglass p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Scopes</p>
          <p className="mt-1 font-semibold text-ink">{status?.scopes ?? "Checking..."}</p>
        </div>
      </div>

      {status && status.missingConfig.length > 0 ? (
        <p className="mt-3 rounded-lg bg-skyglass/10 px-3 py-2 text-sm font-semibold text-danger">
          Missing server env: {status.missingConfig.join(", ")}
        </p>
      ) : null}

      {syncResult ? (
        <div className="mt-4 grid gap-2 text-xs font-semibold text-muted sm:grid-cols-4">
          {Object.entries(syncResult).map(([key, value]) => (
            <div key={key} className="rounded-lg bg-skyglass px-3 py-2">
              <span className="text-moss">{value}</span> {key.replace(/([A-Z])/g, " $1").toLowerCase()}
            </div>
          ))}
        </div>
      ) : null}

      {message ? (
        <p className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${message.toLowerCase().includes("failed") || message.toLowerCase().includes("missing") ? "bg-skyglass/10 text-danger" : "bg-lime/10 text-moss"}`}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
