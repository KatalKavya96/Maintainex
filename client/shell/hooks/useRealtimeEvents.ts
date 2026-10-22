"use client";
import { useEffect } from "react";
import { realtimeDashboardEvent } from "@/state/activities";
import { connectRealtime, disconnectRealtime } from "@/data/realtime";

export function useRealtimeEvents(userId?: string) {
  useEffect(() => {
    if (!userId) return;
    const socket = connectRealtime(userId);
    const events = { "dashboard:update":realtimeDashboardEvent, "feed:new":"maintainex-feed-new", "notification:new":"maintainex-notifications-changed" };
    const handlers = Object.entries(events).map(([event, browserEvent]) => {
      const handler = () => window.dispatchEvent(new Event(browserEvent));
      socket?.on(event, handler);
      return { event, handler };
    });
    return () => { handlers.forEach(({ event, handler }) => socket?.off(event,handler)); disconnectRealtime(); };
  },[userId]);
}
