import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { once } from "node:events";
import { io as connect } from "socket.io-client";
import jwt from "jsonwebtoken";
import { initRealtime, emitToUser } from "../src/realtime/socket";
import { env } from "../src/config/env";

test("realtime rejects user-ID impersonation and isolates authenticated user rooms", async () => {
  const http = createServer();
  const server = initRealtime(http);
  http.listen(0, "127.0.0.1");
  await once(http, "listening");
  const address = http.address() as { port: number };
  const url = `http://127.0.0.1:${address.port}`;
  const clients: ReturnType<typeof connect>[] = [];
  const client = (auth: object) => {
    const socket = connect(url, { auth, autoConnect: false, reconnection: false, transports: ["websocket"] });
    clients.push(socket); return socket;
  };
  try {
    for (const auth of [{ userId: "victim" }, { token: "invalid", userId: "victim" }]) {
      const attacker = client(auth);
      const rejected = once(attacker, "connect_error");
      attacker.connect();
      assert.match((await rejected)[0].message, /Authentication required/);
      attacker.disconnect();
    }
    const token = (id: string) => jwt.sign({ id, name: id, username: id, email: "fixture@invalid.local", role: "ADMIN" }, env.jwtSecret, { expiresIn: "1h" });
    const owner = client({ token: token("owner"), userId: "victim" });
    const victim = client({ token: token("victim") });
    for (const socket of [owner, victim]) { const connected = once(socket, "connect"); socket.connect(); await connected; }
    let leaked = false;
    owner.on("private:fixture", () => { leaked = true; });
    const received = once(victim, "private:fixture");
    emitToUser("victim", "private:fixture", { private: true });
    assert.deepEqual((await received)[0], { private: true });
    await new Promise(resolve => setTimeout(resolve, 40));
    assert.equal(leaked, false);
  } finally {
    clients.forEach(socket => socket.disconnect());
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
