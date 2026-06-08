import { buildApp } from "./app.js";
import { config } from "./config.js";
import { closeDatabase } from "./db/index.js";
import { closeQueue, startInfrastructureWorker } from "./queue/index.js";

const app = buildApp();
const worker = startInfrastructureWorker(app.log);

async function shutdown(signal: string) {
  app.log.info(`Received ${signal}, shutting down PatchWise`);

  await closeQueue();
  await closeDatabase();
  await app.close();

  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

try {
  await app.listen({
    host: config.HOST,
    port: config.PORT
  });

  app.log.info(`PatchWise API listening on ${config.HOST}:${config.PORT}`);
} catch (error) {
  await worker?.close();
  app.log.error(error);
  process.exit(1);
}
