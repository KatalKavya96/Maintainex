"use client";

import { io, type Socket } from "socket.io-client";
import { getSessionToken } from "./session";

let socket: Socket | null = null;

const getRealtimeUrl = () => {
  if (process.env.NEXT_PUBLIC_REALTIME_URL) return process.env.NEXT_PUBLIC_REALTIME_URL.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:5001";
  }

  return "";
};

export function connectRealtime(_userId: string) {
  const url = getRealtimeUrl();
  const token = getSessionToken();
  if (!url || !token) return null;

  if (socket) socket.disconnect();
  socket = io(url, {
    auth: { token },
    transports: ["websocket", "polling"]
  });

  return socket;
}

export function disconnectRealtime() {
  socket?.disconnect();
  socket = null;
}
