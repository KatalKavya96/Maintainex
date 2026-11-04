"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AsyncState, EmptyState, PageHeader } from "@/design-system";
import { getFollowers, getFollowing } from "@/data/api/social";
import type { FollowRecord } from "@/types/social";

export function FollowList({ username, kind }: { username: string; kind: "followers" | "following" }) {
  const [items, setItems] = useState<FollowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(false);
    (kind === "followers" ? getFollowers : getFollowing)(username)
      .then(data => { if (active) setItems(data); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [username, kind, attempt]);
  return <><PageHeader title={kind === "followers" ? "Followers" : "Following"} description={kind === "followers" ? `People following @${username}.` : `People @${username} follows.`} />
    <AsyncState state={loading ? "loading" : error ? "error" : "ready"} onRetry={() => setAttempt(value => value + 1)}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(item => {
        const person = kind === "followers" ? item.follower : item.following;
        return person ? <Link key={person.id} href={`/profile/${person.username}`} className="rounded-xl border border-line bg-panel p-5 hover:border-moss">
          <h2 className="text-lg font-semibold text-ink">{person.name}</h2><p className="mt-1 text-sm text-muted">@{person.username}</p>
          {person.bio ? <p className="mt-3 line-clamp-2 text-sm text-muted">{person.bio}</p> : null}
        </Link> : null;
      })}</div>
      {!items.length ? <EmptyState title={kind === "followers" ? "No followers yet" : "Not following anyone yet"} description="Connections will appear here." /> : null}
    </AsyncState>
  </>;
}
