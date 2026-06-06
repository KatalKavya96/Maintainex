import { createServer } from "http";
import { app } from "./app";
import { env } from "./config/env";
import { initRealtime } from "./realtime/socket";

const server = createServer(app);
initRealtime(server);

server.listen(env.port, () => {
  console.log(`Maintainex API running on http://localhost:${env.port}`);
});
