"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageTitle } from "@/components/common/PageTitle";
import { getFeed } from "@/lib/api";
import { formatDate } from "@/lib/dateUtils";
import type { FeedItem } from "@/types/social";

const filters = [
  { label: "All activity", value: "" },
  { label: "PR reviews", value: "pr-reviews" },
  { label: "Issues", value: "issues" },
  { label: "Closed PRs", value: "closed-prs" }
];

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const load = () => {
      getFeed({ filter }).then(setItems).catch(() => setItems([]));
    };

    load();
    window.addEventListener("maintainex-feed-new", load);
    return () => window.removeEventListener("maintainex-feed-new", load);
  }, [filter]);

  return (
    <>
      <PageTitle title="Feed" description="Public activity from people you follow." />
      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${filter === item.value ? "bg-moss text-black" : "border border-line bg-white text-slate-500 hover:border-moss hover:text-ink"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-line bg-white p-5 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={`/profile/${item.user.username}`} className="font-extrabold text-ink hover:text-moss">{item.user.name}</Link>
                <p className="mt-1 text-sm font-semibold text-slate-500">@{item.user.username} · {formatDate(item.createdAt.slice(0, 10))}</p>
              </div>
              <span className="rounded-lg bg-skyglass px-3 py-1 text-xs font-bold text-moss">{item.activity.activityType.replaceAll("_", " ")}</span>
            </div>
            <p className="mt-4 text-lg font-semibold text-slate-500">{item.text}</p>
          </article>
        ))}
        {!items.length ? <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-soft">Follow contributors to build your feed.</div> : null}
      </div>
    </>
  );
}
