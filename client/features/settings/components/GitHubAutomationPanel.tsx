"use client";

import { useEffect, useState } from "react";
import { Github, RefreshCw, Unplug } from "lucide-react";
import { AsyncState, Badge, Button, Surface } from "@/design-system";
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

  return <Surface className="mb-4"><div className="mb-6 flex items-start gap-3"><Github size={22} className="mt-1 text-muted" /><div><h2 className="text-lg font-medium">GitHub connection</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Import contribution activity and keep its source references alongside your manual records.</p></div></div>
    <AsyncState state={loading ? "loading" : !status ? "error" : "ready"} onRetry={loadStatus}>
      <div className="flex flex-wrap items-center justify-between gap-5 border-y border-line py-5"><div><Badge tone={status?.connected ? "accent" : "neutral"}>{status?.connected ? `Connected as @${status.login}` : "Not connected"}</Badge><p className="mt-3 text-xs text-muted">Last sync · {formatDate(status?.lastSyncedAt)}</p></div><div className="flex flex-wrap gap-2">{status?.connected ? <><Button variant="secondary" onClick={runSync} disabled={working}><RefreshCw size={15} />{working ? "Working…" : "Sync now"}</Button><Button variant="ghost" onClick={()=>{if(window.confirm("Disconnect GitHub? Future syncing will stop until you reconnect."))void disconnect();}} disabled={working}><Unplug size={15} />Disconnect</Button></> : isViewer ? <Button href="/login" variant="secondary">Sign in to connect</Button> : <Button onClick={connect} disabled={working || !status?.configAvailable}>{working ? "Opening…" : "Connect GitHub"}</Button>}</div></div>
      {!isViewer && status && !status.configAvailable && <p className="mt-4 text-sm text-muted">GitHub connections are currently unavailable. Contact your workspace administrator to finish setup.</p>}
      {status?.scopes && <details className="mt-4 text-xs text-muted"><summary className="cursor-pointer">Connection permissions</summary><p className="mt-3 break-words leading-6">{status.scopes}</p></details>}
    </AsyncState>
    {syncResult && <dl className="mt-5 grid gap-3 sm:grid-cols-2">{Object.entries(syncResult).map(([key,value])=><div key={key} className="flex justify-between gap-3 border-b border-line py-2 text-xs"><dt className="text-muted">{key.replace(/([A-Z])/g," $1").toLowerCase()}</dt><dd>{value}</dd></div>)}</dl>}
    {message && <p role="status" className="mt-4 text-sm leading-6 text-muted">{message}</p>}
  </Surface>;
}
