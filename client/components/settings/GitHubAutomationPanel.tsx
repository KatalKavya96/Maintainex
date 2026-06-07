"use client";

import { useEffect, useState } from "react";
import { Github, Loader2, RefreshCw, ShieldCheck, Unplug } from "lucide-react";
import { Button } from "@/components/common/Button";
import { disconnectGitHub, getGitHubOAuthUrl, getGitHubStatus, syncGitHub } from "@/lib/api";
import type { GitHubStatus, GitHubSyncResult } from "@/types/github";

function formatDate(value?: string | null) {
  if (!value) return "Never synced";
  return new Date(value).toLocaleString();
}

export function GitHubAutomationPanel() {
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

  async function connect() {
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
    <section className="mb-4 rounded-xl border border-line bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-skyglass text-moss">
            <Github size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-ink">GitHub automation</h2>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-5 text-slate-500">
              OAuth sync imports only contribution-related repositories, PRs, reviews, issues, comments, and assigned issues. Synced rows stay separate from manual data.
            </p>
          </div>
        </div>
        {loading ? (
          <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-skyglass px-3 text-sm font-bold text-slate-500">
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
          <Button type="button" onClick={connect} disabled={working || !status?.configAvailable}>
            {working ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
            Connect GitHub
          </Button>
        )}
      </div>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        <div className="rounded-lg border border-line bg-skyglass p-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Connection</p>
          <p className="mt-1 font-extrabold text-ink">{status?.connected ? `@${status.login}` : status?.configAvailable ? "Ready to connect" : "OAuth env missing"}</p>
        </div>
        <div className="rounded-lg border border-line bg-skyglass p-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Last sync</p>
          <p className="mt-1 font-extrabold text-ink">{formatDate(status?.lastSyncedAt)}</p>
        </div>
        <div className="rounded-lg border border-line bg-skyglass p-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Webhook</p>
          <p className="mt-1 font-extrabold text-ink">{status?.webhookConfigured ? "Signature verification ready" : "Secret not configured"}</p>
        </div>
      </div>

      {syncResult ? (
        <div className="mt-4 grid gap-2 text-xs font-black text-slate-500 sm:grid-cols-4">
          {Object.entries(syncResult).map(([key, value]) => (
            <div key={key} className="rounded-lg bg-skyglass px-3 py-2">
              <span className="text-moss">{value}</span> {key.replace(/([A-Z])/g, " $1").toLowerCase()}
            </div>
          ))}
        </div>
      ) : null}

      {message ? <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">{message}</p> : null}
    </section>
  );
}
