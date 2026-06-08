import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_HOST: z.string().optional(),
  UPSTASH_REDIS_PORT: z.coerce.number().int().positive().default(6379),
  UPSTASH_REDIS_PASSWORD: z.string().optional(),
  UPSTASH_REDIS_TLS: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true")
});

export const config = envSchema.parse(process.env);
