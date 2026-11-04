"use client";

import { useEffect } from "react";
import { syncGitHub } from "@/data/api/github";
import { realtimeDashboardEvent } from "@/state/activities";

const CHECK_EVERY = 60 * 60 * 1000;

/** Asks the API for a background sync on workspace entry and when the tab regains focus; the API decides whether one is due. */
export function useGitHubAutoSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let lastCheck = 0;
    let running = false;
    const check = () => {
      if (running || Date.now() - lastCheck < CHECK_EVERY) return;
      running = true;
      lastCheck = Date.now();
      syncGitHub({ auto: true })
        .then((result) => {
          if (result.created || result.updated) window.dispatchEvent(new Event(realtimeDashboardEvent));
        })
        .catch(() => undefined)
        .finally(() => { running = false; });
    };
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    check();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [enabled]);
}
