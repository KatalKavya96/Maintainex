"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ActivityBadge } from "@/components/activities/ActivityBadge";
import { PageTitle } from "@/components/common/PageTitle";
import { getFeed } from "@/lib/api";
import { formatDate } from "@/lib/dateUtils";
import type { FeedItem } from "@/types/social";

export default function HomePage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);

  useEffect(() => {
    const load = () => getFeed().then(setFeed).catch(() => setFeed([]));
    load();
    window.addEventListener("maintainex-feed-new", load);
    return () => window.removeEventListener("maintainex-feed-new", load);
  }, []);

  return (
    <>
      <PageTitle title="Home" description="Activity from people you follow." />
      <section className="mx-auto max-w-3xl">
        <div className="space-y-3">
          {feed.map((item) => (
            <article key={item.id} className="rounded-xl border border-line bg-white p-4 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  <Link href={`/profile/${item.user.username}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-moss text-sm font-black text-black">
                    {item.user.name.slice(0, 1).toUpperCase()}
                  </Link>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-500">
                      <Link href={`/profile/${item.user.username}`} className="font-bold text-ink hover:text-moss">{item.user.name}</Link>{" "}
                      contributed to{" "}
                      <Link href={`/repos/${encodeURIComponent(item.activity.organizationName)}/${encodeURIComponent(item.activity.repositoryName)}`} className="font-bold text-ink hover:text-moss">
                        {item.activity.organizationName}/{item.activity.repositoryName}
                      </Link>
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{formatDate(item.createdAt.slice(0, 10))}</p>
                  </div>
                </div>
                <ActivityBadge value={item.activity.activityType} />
              </div>
              <h3 className="mt-4 text-base font-extrabold text-ink">{item.activity.title}</h3>
              {item.activity.description ? <p className="mt-2 rounded-lg bg-skyglass p-3 text-sm font-semibold leading-6 text-slate-500">{item.activity.description}</p> : null}
            </article>
          ))}
          {!feed.length ? (
            <div className="rounded-xl border border-line bg-white p-10 text-center shadow-soft">
              <h2 className="text-lg font-extrabold text-ink">Your feed is warming up.</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                Follow developers from search above and their Maintainex activity will start showing up here.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
