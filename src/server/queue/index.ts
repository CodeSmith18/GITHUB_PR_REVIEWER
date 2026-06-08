import { Job, Queue, Worker } from "bullmq";

import { config } from "../config.js";
import type { InfrastructureStatus } from "../db/index.js";

export const PATCHWISE_QUEUE_NAME = "patchwise-background";

export type PatchwiseJobName = "infrastructure_check";

export interface InfrastructureCheckJob {
  requestedAt: string;
  source: "stage_2";
}

export type PatchwiseJobData = InfrastructureCheckJob;

export interface PatchwiseJobResult {
  ok: boolean;
  checkedAt: string;
  message: string;
}

type BullRedisConnection = {
  enableReadyCheck: false;
  maxRetriesPerRequest: null;
  skipVersionCheck: true;
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  tls?: Record<string, never>;
};

type PatchwiseQueue = ReturnType<typeof createQueue>;
type PatchwiseWorker = ReturnType<typeof createWorker>;

let queue: PatchwiseQueue | null = null;
let worker: PatchwiseWorker | null = null;

export function isQueueConfigured() {
  return Boolean(
    config.REDIS_URL || (config.UPSTASH_REDIS_HOST && config.UPSTASH_REDIS_PASSWORD)
  );
}

function getRedisConnectionOptions(): BullRedisConnection {
  const baseOptions: Pick<
    BullRedisConnection,
    "enableReadyCheck" | "maxRetriesPerRequest" | "skipVersionCheck"
  > = {
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    skipVersionCheck: true
  };

  if (config.REDIS_URL) {
    return {
      ...baseOptions,
      url: config.REDIS_URL
    };
  }

  return {
    ...baseOptions,
    host: config.UPSTASH_REDIS_HOST,
    port: config.UPSTASH_REDIS_PORT,
    password: config.UPSTASH_REDIS_PASSWORD,
    tls: config.UPSTASH_REDIS_TLS ? {} : undefined
  };
}

function createQueue() {
  return new Queue<
    PatchwiseJobData,
    PatchwiseJobResult,
    PatchwiseJobName,
    PatchwiseJobData,
    PatchwiseJobResult,
    PatchwiseJobName
  >(
    PATCHWISE_QUEUE_NAME,
    {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: {
        attempts: 2,
        removeOnComplete: 50,
        removeOnFail: 100
      }
    }
  );
}

export function getQueue(): PatchwiseQueue {
  if (!isQueueConfigured()) {
    throw new Error("Redis is not configured");
  }

  queue ??= createQueue();

  return queue;
}

export async function enqueueInfrastructureCheck() {
  return getQueue().add("infrastructure_check", {
    requestedAt: new Date().toISOString(),
    source: "stage_2"
  });
}

export async function checkQueueHealth(): Promise<{
  status: InfrastructureStatus;
  message: string;
}> {
  if (!isQueueConfigured()) {
    return {
      status: "not_configured",
      message: "Redis connection settings are not set"
    };
  }

  try {
    await getQueue().waitUntilReady();

    return {
      status: "ok",
      message: "Redis connection is healthy"
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown Redis error"
    };
  }
}

export function startInfrastructureWorker(logger: Pick<Console, "info" | "error"> = console) {
  if (!isQueueConfigured()) {
    logger.info("PatchWise worker skipped because Redis is not configured");
    return null;
  }

  if (worker) {
    return worker;
  }

  worker = createWorker(logger);

  return worker;
}

function createWorker(logger: Pick<Console, "info" | "error">) {
  const nextWorker = new Worker<PatchwiseJobData, PatchwiseJobResult, PatchwiseJobName>(
    PATCHWISE_QUEUE_NAME,
    async (job: Job<PatchwiseJobData, PatchwiseJobResult, PatchwiseJobName>) => {
      if (job.name === "infrastructure_check") {
        return {
          ok: true,
          checkedAt: new Date().toISOString(),
          message: "Stage 2 worker processed the infrastructure check job"
        };
      }

      throw new Error(`Unsupported job type: ${job.name}`);
    },
    {
      connection: getRedisConnectionOptions(),
      concurrency: 1
    }
  );

  nextWorker.on("completed", (job) => {
    logger.info(`PatchWise job completed: ${job.name}#${job.id}`);
  });

  nextWorker.on("failed", (job, error) => {
    logger.error(`PatchWise job failed: ${job?.name ?? "unknown"}#${job?.id ?? "unknown"}`);
    logger.error(error);
  });

  return nextWorker;
}

export async function closeQueue() {
  if (worker) {
    await worker.close();
    worker = null;
  }

  if (queue) {
    await queue.close();
    queue = null;
  }

}
