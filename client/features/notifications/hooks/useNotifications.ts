"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getNotifications, markNotificationRead } from "@/data/api/social";
import type { NotificationItem } from "@/types/social";

export const canReadNotification = (item: NotificationItem) => !item.readAt && !item.id.startsWith("scheduled-");

export function useNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const version = useRef(0);
  const reading = useRef(false);
  const load = useCallback(() => {
    const request = ++version.current;
    setLoading(true); setError("");
    return getNotifications().then(data => { if (request === version.current) setItems(data); })
      .catch(() => { if (request === version.current) setError("Unable to load notifications."); })
      .finally(() => { if (request === version.current) setLoading(false); });
  }, []);
  useEffect(() => {
    void load();
    const refresh = () => { void load(); };
    window.addEventListener("maintainex-notifications-changed", refresh);
    return () => { version.current++; window.removeEventListener("maintainex-notifications-changed", refresh); };
  }, [load]);
  const markRead = async (id: string) => {
    const item = items.find(item => item.id === id);
    if (!item || !canReadNotification(item) || reading.current) return;
    reading.current = true; setPending(id); setError("");
    try {
      await markNotificationRead(id);
      setItems(current => current.map(item => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
      window.dispatchEvent(new Event("maintainex-notifications-changed"));
    } catch { setError("Unable to mark notification as read. Please retry."); }
    finally { reading.current = false; setPending(null); }
  };
  return { items, loading, error, pending, load, markRead };
}
