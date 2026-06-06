import type { Server as HttpServer } from "http";
import { Server } from "socket.io";

let io: Server | null = null;

export function initRealtime(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    const userId = typeof socket.handshake.auth.userId === "string" ? socket.handshake.auth.userId : undefined;
    if (userId) socket.join(`user:${userId}`);
  });

  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitDashboardUpdate(userId: string) {
  emitToUser(userId, "dashboard:update", { at: new Date().toISOString() });
}
