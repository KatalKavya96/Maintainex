"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageTitle } from "@/components/common/PageTitle";
import { getFollowing } from "@/lib/api";
import type { FollowRecord } from "@/types/social";

export default function FollowingPage() {
  const params = useParams<{ username: string }>();
  const [items, setItems] = useState<FollowRecord[]>([]);

  useEffect(() => {
    getFollowing(params.username).then(setItems).catch(() => setItems([]));
  }, [params.username]);

  return (
    <>
      <PageTitle title="Following" description={`People @${params.username} follows.`} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => item.following ? (
          <Link key={item.following.id} href={`/profile/${item.following.username}`} className="rounded-2xl border border-line bg-white p-5 shadow-soft transition hover:border-moss">
            <h2 className="text-xl font-extrabold text-ink">{item.following.name}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">@{item.following.username}</p>
            <p className="mt-3 line-clamp-2 text-sm text-slate-500">{item.following.bio || "No bio added yet."}</p>
          </Link>
        ) : null)}
      </div>
    </>
  );
}
