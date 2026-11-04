import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { verifySession } from "../modules/auth/session";

let io: Server | null = null;

export function initRealtime(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      socket.data.user = verifySession(socket.handshake.auth.token);
      next();
    } catch {
      next(new Error("Authentication required"));
    }
  });
  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.user.id}`);
  });

  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitDashboardUpdate(userId: string) {
  emitToUser(userId, "dashboard:update", { at: new Date().toISOString() });
}
