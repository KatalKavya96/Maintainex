"use client";

import { AsyncState, Feedback, Button } from "@/design-system";
import { useNotifications, canReadNotification } from "../hooks/useNotifications";
import { Bell } from "lucide-react";
import { PageTitle } from "@/design-system/patterns/PageTitle";
import { formatDate } from "@/shared/lib/dateUtils";

export default function NotificationsPage() {
  const { items, loading, error, pending, load, markRead } = useNotifications();

  return (
    <>
      <PageTitle title="Notifications" description="Social, goal, schedule, badge, and reminder updates." />
      {error ? <Feedback message={error} /> : null}
      <AsyncState state={loading ? "loading" : error && !items.length ? "error" : "ready"} onRetry={load}>
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className={`rounded-2xl border border-line bg-panel p-5 shadow-soft ${item.readAt ? "opacity-70" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-skyglass text-moss">
                  <Bell size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-moss">{item.type}</p>
                  <h2 className="mt-1 text-lg font-semibold text-ink">{item.title}</h2>
                  <p className="mt-1 text-sm font-semibold text-muted">{item.body}</p>
                  <p className="mt-2 text-xs font-bold text-muted">{formatDate(item.createdAt.slice(0, 10))}</p>
                </div>
              </div>
              {canReadNotification(item) ? <Button variant="secondary" disabled={pending !== null} onClick={() => markRead(item.id)}>Mark read</Button> : null}
            </div>
          </article>
        ))}
        {!items.length ? <div className="rounded-2xl border border-line bg-panel p-8 text-center text-sm font-semibold text-muted shadow-soft">No notifications yet.</div> : null}
      </div>
      </AsyncState>
    </>
  );
}
