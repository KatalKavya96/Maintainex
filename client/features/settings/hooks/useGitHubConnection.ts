"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { connectGitHub, disconnectGitHub, getGitHubOAuthUrl, getGitHubStatus, syncGitHub, updateGitHubPreferences } from "@/data/api/github";
import { beginOAuthFlow, takeOAuthFlow } from "@/data/oauthFlow";
import { realtimeDashboardEvent } from "@/state/activities";
import type { GitHubPreferences, GitHubStatus, GitHubSyncResult } from "@/types/github";

export type Working = "connect" | "sync" | "disconnect" | keyof GitHubPreferences | null;
export type Notice = { tone: "info" | "error"; text: string } | null;

const errorText = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

export function describeSync(result: GitHubSyncResult) {
  if (result.status === "skipped") return "Already up to date.";
  const parts = [result.created ? `${result.created} new` : "", result.updated ? `${result.updated} refreshed` : ""].filter(Boolean);
  const notes = [
    result.keptDeleted ? `${result.keptDeleted} you deleted stayed deleted` : "",
    result.failed ? `${result.failed} could not be read` : "",
    result.truncated ? "more history remains; sync again to continue" : ""
  ].filter(Boolean);
  return `${parts.length ? `Sync finished: ${parts.join(", ")}.` : "Sync finished: nothing new."}${notes.length ? ` ${notes.join("; ")}.` : ""}`;
}

export function useGitHubConnection() {
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<Working>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const handled = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await getGitHubStatus());
    } catch (error) {
      setNotice({ tone: "error", text: errorText(error, "Unable to load your GitHub connection.") });
    } finally {
      setLoading(false);
    }
  }, []);

  const sync = useCallback(async () => {
    setWorking("sync");
    setNotice({ tone: "info", text: "Importing from GitHub…" });
    try {
      const result = await syncGitHub();
      setNotice({ tone: "info", text: describeSync(result) });
      window.dispatchEvent(new Event(realtimeDashboardEvent));
    } catch (error) {
      setNotice({ tone: "error", text: errorText(error, "GitHub sync failed. Try again shortly.") });
    } finally {
      setWorking(null);
      await load();
    }
  }, [load]);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const params = new URLSearchParams(window.location.search);
    const handoff = params.get("githubHandoff");
    const failure = params.get("githubError");
    if (handoff || failure) window.history.replaceState(null, "", "/settings");
    if (failure) {
      takeOAuthFlow("github-connect");
      setNotice({ tone: "error", text: failure });
    }
    if (!handoff) {
      void load();
      return;
    }
    const flow = takeOAuthFlow("github-connect");
    if (!flow) {
      setNotice({ tone: "error", text: "This GitHub connection was started in a different tab or browser. Start again here." });
      void load();
      return;
    }
    setWorking("connect");
    connectGitHub(handoff, flow.nonce)
      .then(async ({ login }) => {
        setNotice({ tone: "info", text: `Connected as @${login}. Importing your recent activity…` });
        setWorking(null);
        await sync();
      })
      .catch(async (error) => {
        setNotice({ tone: "error", text: errorText(error, "GitHub could not be connected.") });
        setWorking(null);
        await load();
      });
  }, [load, sync]);

  async function connect() {
    setWorking("connect");
    setNotice(null);
    try {
      const { url } = await getGitHubOAuthUrl(beginOAuthFlow("github-connect"));
      window.location.assign(url);
    } catch (error) {
      setNotice({ tone: "error", text: errorText(error, "GitHub connections are not available right now.") });
      setWorking(null);
    }
  }

  async function setPreference(key: keyof GitHubPreferences, value: boolean) {
    if (!status?.preferences) return;
    const previous = status.preferences;
    setStatus({ ...status, preferences: { ...previous, [key]: value } });
    setWorking(key);
    try {
      const preferences = await updateGitHubPreferences({ [key]: value });
      setStatus((current) => (current ? { ...current, preferences } : current));
    } catch (error) {
      setStatus((current) => (current ? { ...current, preferences: previous } : current));
      setNotice({ tone: "error", text: errorText(error, "That setting could not be saved.") });
    } finally {
      setWorking(null);
    }
  }

  async function disconnect(removeImported: boolean) {
    setWorking("disconnect");
    try {
      const { removed } = await disconnectGitHub(removeImported);
      const detail = removeImported ? ` Removed ${removed.activities} imported activities and ${removed.work} work items.` : " Imported records were kept.";
      setNotice({ tone: "info", text: `GitHub disconnected.${detail}` });
      window.dispatchEvent(new Event(realtimeDashboardEvent));
    } catch (error) {
      setNotice({ tone: "error", text: errorText(error, "GitHub could not be disconnected.") });
    } finally {
      setWorking(null);
      await load();
    }
  }

  return { status, loading, working, notice, load, connect, sync, setPreference, disconnect };
}
