"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageTitle } from "@/components/common/PageTitle";
import { getFollowers } from "@/lib/api";
import type { FollowRecord } from "@/types/social";

export default function FollowersPage() {
  const params = useParams<{ username: string }>();
  const [items, setItems] = useState<FollowRecord[]>([]);

  useEffect(() => {
    getFollowers(params.username).then(setItems).catch(() => setItems([]));
  }, [params.username]);

  return (
    <>
      <PageTitle title="Followers" description={`People following @${params.username}.`} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => item.follower ? (
          <Link key={item.follower.id} href={`/profile/${item.follower.username}`} className="rounded-2xl border border-line bg-white p-5 shadow-soft transition hover:border-moss">
            <h2 className="text-xl font-extrabold text-ink">{item.follower.name}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">@{item.follower.username}</p>
            <p className="mt-3 line-clamp-2 text-sm text-slate-500">{item.follower.bio || "No bio added yet."}</p>
          </Link>
        ) : null)}
      </div>
    </>
  );
}
