"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getProfiles } from "@/lib/api";
import type { ProfileSummary } from "@/types/profile";

export function UserSearch() {
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    getProfiles().then(setProfiles).catch(() => setProfiles([]));
  }, []);

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return profiles.slice(0, 5);
    return profiles
      .filter((profile) =>
        [profile.name, profile.username, profile.email, profile.bio ?? ""].some((field) => field.toLowerCase().includes(value))
      )
      .slice(0, 7);
  }, [profiles, query]);

  const showResults = focused && (query.trim().length > 0 || profiles.length > 0);

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 140)}
        placeholder="Search users..."
        className="h-9 w-full rounded-lg border border-line bg-skyglass pl-9 pr-3 text-sm font-semibold text-ink outline-none transition placeholder:text-slate-500 focus:border-moss focus:ring-2 focus:ring-moss/10"
      />
      {showResults ? (
        <div className="absolute left-0 right-0 top-11 z-40 overflow-hidden rounded-xl border border-line bg-white shadow-soft">
          <div className="border-b border-line px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">Developers</div>
          <div className="max-h-80 overflow-y-auto py-1">
            {results.map((profile) => (
              <Link
                key={profile.id}
                href={`/profile/${profile.username}`}
                className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-skyglass"
                onClick={() => setQuery("")}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-moss text-xs font-black text-black">
                  {profile.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-ink">{profile.name}</span>
                  <span className="block truncate text-xs font-semibold text-slate-500">@{profile.username}</span>
                </span>
              </Link>
            ))}
            {!results.length ? <p className="px-3 py-4 text-sm font-semibold text-slate-500">No users found.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
