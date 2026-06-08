import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import { config } from "../config.js";
import * as schema from "./schema.js";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export type InfrastructureStatus = "ok" | "not_configured" | "error";

export function isDatabaseConfigured() {
  return Boolean(config.DATABASE_URL);
}

export function getPool() {
  if (!config.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  pool ??= new Pool({
    connectionString: config.DATABASE_URL,
    max: 5
  });

  return pool;
}

export function getDb() {
  db ??= drizzle(getPool(), { schema });
  return db;
}

export async function checkDatabaseHealth(): Promise<{
  status: InfrastructureStatus;
  message: string;
}> {
  if (!isDatabaseConfigured()) {
    return {
      status: "not_configured",
      message: "DATABASE_URL is not set"
    };
  }

  try {
    await getPool().query("select 1");

    return {
      status: "ok",
      message: "PostgreSQL connection is healthy"
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown PostgreSQL error"
    };
  }
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}
