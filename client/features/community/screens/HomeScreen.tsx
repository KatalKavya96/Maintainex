"use client";

import { useCallback, useEffect, useState } from "react";

import { AsyncState } from "@/design-system";
import { PageTitle } from "@/design-system/patterns/PageTitle";
import { getFeed } from "@/data/api/social";

import type { ActivityEngagement, FeedItem } from "@/types/social";

import { FeedCard } from "../components/FeedCard";

export default function HomePage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => { setLoading(true); setFailed(false); return getFeed().then(setFeed).catch(() => setFailed(true)).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    load();
    window.addEventListener("maintainex-feed-new", load);
    return () => window.removeEventListener("maintainex-feed-new", load);
  }, [load]);

  function updateEngagement(activityId: string, engagement: ActivityEngagement) {
    setFeed((current) => current.map((item) => (item.activity.id === activityId ? { ...item, engagement } : item)));
  }

  return (
    <>
      <PageTitle title="Community" description="Activity from people you follow." />
      <AsyncState state={loading ? "loading" : failed ? "error" : "ready"} onRetry={load}><section className="mx-auto max-w-3xl">
        <div className="space-y-3">
          {feed.map((item) => (
            <FeedCard key={item.id} item={item} onEngagementChange={updateEngagement} />
          ))}
          {!feed.length ? (
            <div className="rounded-xl border border-line bg-panel p-10 text-center shadow-soft">
              <h2 className="text-lg font-semibold text-ink">Your feed is warming up.</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">
                Follow developers from search above and their Maintainex activity will start showing up here.
              </p>
            </div>
          ) : null}
        </div>
      </section></AsyncState>
    </>
  );
}
