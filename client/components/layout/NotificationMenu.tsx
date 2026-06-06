"use client";

import Link from "next/link";
import { Bell, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getNotifications, markNotificationRead } from "@/lib/api";
import { formatDate } from "@/lib/dateUtils";
import type { NotificationItem } from "@/types/social";

export function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);

  const load = () => getNotifications().then(setItems).catch(() => setItems([]));

  useEffect(() => {
    load();
    window.addEventListener("maintainex-notifications-changed", load);
    return () => window.removeEventListener("maintainex-notifications-changed", load);
  }, []);

  const unread = useMemo(() => items.filter((item) => !item.readAt).length, [items]);

  async function read(id: string) {
    if (id.startsWith("scheduled-")) return;
    await markNotificationRead(id);
    load();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-line bg-skyglass text-slate-500 transition hover:border-moss hover:text-ink"
        title="Notifications"
      >
        <Bell size={17} />
        {unread ? <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-moss px-1 text-[10px] font-black text-black">{unread}</span> : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-40 w-[min(92vw,380px)] overflow-hidden rounded-xl border border-line bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-extrabold text-ink">Notifications</p>
              <p className="text-xs font-semibold text-slate-500">{unread ? `${unread} unread` : "You're all caught up"}</p>
            </div>
            <Link href="/notifications" className="text-xs font-bold text-moss" onClick={() => setOpen(false)}>
              View inbox
            </Link>
          </div>
          <div className="max-h-[28rem] overflow-y-auto">
            {items.slice(0, 8).map((item) => (
              <article key={item.id} className="border-b border-line px-4 py-3 last:border-b-0">
                <div className="flex gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.readAt ? "bg-slate-500" : "bg-moss"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{item.body}</p>
                    <p className="mt-1 text-[11px] font-bold text-slate-500">{formatDate(item.createdAt.slice(0, 10))}</p>
                  </div>
                  {!item.readAt && !item.id.startsWith("scheduled-") ? (
                    <button type="button" onClick={() => read(item.id)} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-skyglass hover:text-moss" title="Mark as read">
                      <CheckCircle2 size={15} />
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
            {!items.length ? <p className="px-4 py-8 text-center text-sm font-semibold text-slate-500">No notifications yet.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
