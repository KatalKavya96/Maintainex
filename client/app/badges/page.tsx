"use client";

import { useEffect, useState } from "react";
import { Award } from "lucide-react";
import { PageTitle } from "@/components/common/PageTitle";
import { getBadges } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import type { Badge } from "@/types/social";

export default function BadgesPage() {
  const { user } = useAuthStore();
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    if (!user?.username) return;
    getBadges(user.username).then(setBadges).catch(() => setBadges([]));
  }, [user?.username]);

  return (
    <>
      <PageTitle title="Badges" description="Achievements earned from your contribution history." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {badges.map((badge) => (
          <article key={badge.name} className={`rounded-2xl border p-5 shadow-soft ${badge.earned ? "border-moss/40 bg-white" : "border-line bg-white opacity-60"}`}>
            <div className={`grid h-12 w-12 place-items-center rounded-xl ${badge.earned ? "bg-moss text-black" : "bg-skyglass text-slate-500"}`}>
              <Award size={22} />
            </div>
            <h2 className="mt-4 text-lg font-extrabold text-ink">{badge.name}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">{badge.earned ? "Unlocked" : "Keep contributing to unlock this."}</p>
          </article>
        ))}
      </div>
    </>
  );
}
