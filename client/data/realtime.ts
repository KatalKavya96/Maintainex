"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

const getRealtimeUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "").replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:5001";
  }

  return "";
};

export function connectRealtime(userId: string) {
  const url = getRealtimeUrl();
  if (!url) return null;

  if (socket) socket.disconnect();
  socket = io(url, {
    auth: { userId },
    transports: ["websocket", "polling"]
  });

  return socket;
}

export function disconnectRealtime() {
  socket?.disconnect();
  socket = null;
}
