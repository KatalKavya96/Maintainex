"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { PageTitle } from "@/components/common/PageTitle";
import { getNotifications, markNotificationRead } from "@/lib/api";
import { formatDate } from "@/lib/dateUtils";
import type { NotificationItem } from "@/types/social";

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const load = () => getNotifications().then(setItems).catch(() => setItems([]));

  useEffect(() => {
    load();
    window.addEventListener("maintainex-notifications-changed", load);
    return () => window.removeEventListener("maintainex-notifications-changed", load);
  }, []);

  async function markRead(id: string) {
    await markNotificationRead(id);
    load();
  }

  return (
    <>
      <PageTitle title="Notifications" description="Social, goal, schedule, badge, and reminder updates." />
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className={`rounded-2xl border border-line bg-white p-5 shadow-soft ${item.readAt ? "opacity-70" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-skyglass text-moss">
                  <Bell size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-moss">{item.type}</p>
                  <h2 className="mt-1 text-lg font-extrabold text-ink">{item.title}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{item.body}</p>
                  <p className="mt-2 text-xs font-bold text-slate-500">{formatDate(item.createdAt.slice(0, 10))}</p>
                </div>
              </div>
              {!item.readAt ? <button type="button" onClick={() => markRead(item.id)} className="rounded-lg border border-line px-3 py-2 text-sm font-bold text-slate-500 hover:border-moss hover:text-ink">Mark read</button> : null}
            </div>
          </article>
        ))}
        {!items.length ? <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-soft">No notifications yet.</div> : null}
      </div>
    </>
  );
}
