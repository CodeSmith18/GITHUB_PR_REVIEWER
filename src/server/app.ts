import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webBuildPath = path.resolve(__dirname, "../../dist-web");

export function buildApp() {
  const app = Fastify({
    logger: config.NODE_ENV === "production"
  });

  app.register(cors, {
    origin: true
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "patchwise-api",
    environment: config.NODE_ENV
  }));

  app.get("/api/stage", async () => ({
    stage: 1,
    name: "foundation",
    ready: true
  }));

  if (existsSync(webBuildPath)) {
    app.register(fastifyStatic, {
      root: webBuildPath,
      prefix: "/"
    });

    app.setNotFoundHandler((request, reply) => {
      if (request.method === "GET" && !request.url.startsWith("/api/")) {
        return reply.sendFile("index.html");
      }

      return reply.status(404).send({
        error: "Not Found",
        message: "Route not found"
      });
    });
  }

  return app;
}
