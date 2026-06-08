import { buildApp } from "./app.js";
import { config } from "./config.js";

const app = buildApp();

try {
  await app.listen({
    host: config.HOST,
    port: config.PORT
  });

  app.log.info(`PatchWise API listening on ${config.HOST}:${config.PORT}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
