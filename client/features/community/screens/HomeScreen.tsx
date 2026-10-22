"use client";

import { useEffect, useState } from "react";

import { PageTitle } from "@/design-system/patterns/PageTitle";
import { getFeed } from "@/data/api/social";

import type { ActivityEngagement, FeedItem } from "@/types/social";

import { FeedCard } from "../components/FeedCard";

export default function HomePage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);

  useEffect(() => {
    const load = () => getFeed().then(setFeed).catch(() => setFeed([]));
    load();
    window.addEventListener("maintainex-feed-new", load);
    return () => window.removeEventListener("maintainex-feed-new", load);
  }, []);

  function updateEngagement(activityId: string, engagement: ActivityEngagement) {
    setFeed((current) => current.map((item) => (item.activity.id === activityId ? { ...item, engagement } : item)));
  }

  return (
    <>
      <PageTitle title="Home" description="Activity from people you follow." />
      <section className="mx-auto max-w-3xl">
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
      </section>
    </>
  );
}
