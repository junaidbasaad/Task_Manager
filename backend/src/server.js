import http from "http";
import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

const server = http.createServer(app);

server.listen(env.port, () => {
  console.log(`API listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

function shutdown(signal) {
  console.log(`${signal} received, closing server…`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.error("Prisma disconnect error", e);
    }
    process.exit(0);
  });
  setTimeout(() => {
    console.error("Forced exit after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
