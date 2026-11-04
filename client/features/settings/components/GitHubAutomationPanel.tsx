"use client";

import { useState } from "react";
import { Github, RefreshCw, Unplug } from "lucide-react";
import { AsyncState, Badge, Button, Surface } from "@/design-system";
import { useAuthStore } from "@/state/auth";
import type { GitHubPreferences, GitHubStatus } from "@/types/github";
import { useGitHubConnection, type Working } from "../hooks/useGitHubConnection";

const imports: Array<{ key: keyof GitHubPreferences; label: string; hint: string }> = [
  { key: "importPullRequests", label: "Pull requests you opened", hint: "Including when they merge" },
  { key: "importReviews", label: "Pull requests you reviewed", hint: "On other people's work" },
  { key: "importIssues", label: "Issues you opened", hint: "" },
  { key: "importComments", label: "Threads you commented on", hint: "Where you are not the author" },
  { key: "importAssignedIssues", label: "Issues assigned to you", hint: "Added to Work as planned items" },
  { key: "importRepositories", label: "Your repositories", hint: "Listed under Organizations" }
];

function lastSync(value: string | null) {
  if (!value) return "Not synced yet";
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60_000);
  if (minutes < 1) return "Synced just now";
  if (minutes < 60) return `Synced ${minutes} min ago`;
  if (minutes < 48 * 60) return `Synced ${Math.round(minutes / 60)} h ago`;
  return `Synced ${new Date(value).toLocaleDateString()}`;
}

function Toggle({ checked, disabled, label, hint, onChange }: { checked: boolean; disabled: boolean; label: string; hint?: string; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-2 text-sm">
      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-line" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span>
        <span className="block">{label}</span>
        {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

function Preferences({ status, working, onChange }: { status: GitHubStatus; working: Working; onChange: (key: keyof GitHubPreferences, value: boolean) => void }) {
  const prefs = status.preferences!;
  return (
    <div className="mt-5 grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="text-sm font-medium">Updates</h3>
        <Toggle checked={prefs.autoSync} disabled={working !== null} label="Keep in sync automatically" hint="Checks GitHub about once an hour while you use Maintainex" onChange={(value) => onChange("autoSync", value)} />
        <p className="mt-3 text-xs leading-5 text-muted">
          Your edits to imported records are kept; GitHub only refreshes their status. Anything you delete stays deleted.
        </p>
      </div>
      <fieldset>
        <legend className="text-sm font-medium">What to import</legend>
        {imports.map((item) => (
          <Toggle key={item.key} checked={prefs[item.key]} disabled={working !== null} label={item.label} hint={item.hint} onChange={(value) => onChange(item.key, value)} />
        ))}
      </fieldset>
    </div>
  );
}

function DisconnectConfirm({ busy, onCancel, onConfirm }: { busy: boolean; onCancel: () => void; onConfirm: (removeImported: boolean) => void }) {
  const [remove, setRemove] = useState(false);
  return (
    <div role="group" aria-label="Disconnect GitHub" className="mt-5 rounded-lg border border-line p-4">
      <p className="text-sm font-medium">Disconnect GitHub?</p>
      <p className="mt-1 text-xs text-muted">Syncing stops and Maintainex gives up its GitHub access.</p>
      <div className="mt-3 space-y-1 text-sm">
        <label className="flex items-center gap-2"><input type="radio" name="github-imported" checked={!remove} onChange={() => setRemove(false)} />Keep imported activities and work</label>
        <label className="flex items-center gap-2"><input type="radio" name="github-imported" checked={remove} onChange={() => setRemove(true)} />Remove everything imported from GitHub</label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="danger" size="sm" disabled={busy} onClick={() => onConfirm(remove)}>{busy ? "Disconnecting…" : "Disconnect"}</Button>
        <Button variant="ghost" size="sm" disabled={busy} onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export function GitHubAutomationPanel() {
  const { isViewer } = useAuthStore();
  const { status, loading, working, notice, load, connect, sync, setPreference, disconnect } = useGitHubConnection();
  const [confirming, setConfirming] = useState(false);
  const syncing = working === "sync" || Boolean(status?.syncing);

  let badge = <Badge>Not connected</Badge>;
  if (status?.needsReconnect) badge = <Badge tone="danger">Reconnect needed · @{status.login}</Badge>;
  else if (status?.connected) badge = <Badge tone="accent">Connected as @{status.login}</Badge>;

  let actions = null;
  if (isViewer) actions = <Button href="/login" variant="secondary">Sign in to connect</Button>;
  else if (status?.needsReconnect) {
    actions = <>
      <Button onClick={connect} disabled={working !== null}>{working === "connect" ? "Opening GitHub…" : "Reconnect GitHub"}</Button>
      <Button variant="ghost" onClick={() => setConfirming(true)} disabled={working !== null}><Unplug size={15} />Disconnect</Button>
    </>;
  }
  else if (status?.connected) {
    actions = <>
      <Button variant="secondary" onClick={sync} disabled={working !== null || syncing}><RefreshCw size={15} className={syncing ? "animate-spin" : undefined} />{syncing ? "Syncing…" : "Sync now"}</Button>
      <Button variant="ghost" onClick={() => setConfirming(true)} disabled={working !== null}><Unplug size={15} />Disconnect</Button>
    </>;
  } else actions = <Button onClick={connect} disabled={working !== null || !status?.configAvailable}>{working === "connect" ? "Opening GitHub…" : "Connect GitHub"}</Button>;

  return (
    <Surface className="mb-4">
      <div className="mb-6 flex items-start gap-3">
        <Github size={22} className="mt-1 text-muted" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-medium">GitHub connection</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Import your pull requests, reviews, issues and assignments, and keep them up to date. You choose what comes in.</p>
        </div>
      </div>
      <AsyncState state={loading && !status ? "loading" : !status ? "error" : "ready"} onRetry={load}>
        <div className="flex flex-wrap items-center justify-between gap-5 border-y border-line py-5">
          <div>
            {badge}
            {status?.connected ? <p className="mt-3 text-xs text-muted">{syncing ? "Sync in progress…" : lastSync(status.lastSyncedAt)}{status.preferences?.autoSync ? " · automatic updates on" : " · automatic updates off"}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </div>
        {status && !status.connected && !isViewer && !status.configAvailable ? <p className="mt-4 text-sm text-muted">GitHub connections are not set up on this deployment yet. The administrator needs to add the GitHub OAuth app credentials.</p> : null}
        {status?.lastSyncError ? <p role="alert" className="mt-4 text-sm text-danger">{status.lastSyncError}</p> : null}
        {confirming && status?.connected ? <DisconnectConfirm busy={working === "disconnect"} onCancel={() => setConfirming(false)} onConfirm={(remove) => void disconnect(remove).then(() => setConfirming(false))} /> : null}
        {status?.connected && status.preferences && !status.needsReconnect ? <Preferences status={status} working={working} onChange={(key, value) => void setPreference(key, value)} /> : null}
        {status?.scopes ? <details className="mt-5 text-xs text-muted"><summary className="cursor-pointer">Permissions requested</summary><p className="mt-3 break-words leading-6">{status.scopes}</p></details> : null}
      </AsyncState>
      {notice && notice.text !== status?.lastSyncError ? <p role={notice.tone === "error" ? "alert" : "status"} className={`mt-4 text-sm leading-6 ${notice.tone === "error" ? "text-danger" : "text-muted"}`}>{notice.text}</p> : null}
    </Surface>
  );
}
