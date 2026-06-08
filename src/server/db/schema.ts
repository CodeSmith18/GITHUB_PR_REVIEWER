import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector
} from "drizzle-orm/pg-core";

export const repositoryStatus = pgEnum("repository_status", [
  "pending",
  "indexing",
  "indexed",
  "failed"
]);

export const jobStatus = pgEnum("job_status", [
  "pending",
  "running",
  "completed",
  "failed"
]);

export const reviewStatus = pgEnum("review_status", [
  "pending",
  "running",
  "completed",
  "failed"
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
};

export const githubInstallations = pgTable(
  "github_installations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    githubInstallationId: text("github_installation_id").notNull(),
    accountLogin: text("account_login").notNull(),
    accountType: text("account_type").notNull(),
    suspendedAt: timestamp("suspended_at", { withTimezone: true }),
    ...timestamps
  },
  (table) => [uniqueIndex("github_installations_github_id_idx").on(table.githubInstallationId)]
);

export const repositories = pgTable(
  "repositories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    installationId: uuid("installation_id")
      .notNull()
      .references(() => githubInstallations.id, { onDelete: "cascade" }),
    githubRepositoryId: text("github_repository_id").notNull(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    fullName: text("full_name").notNull(),
    defaultBranch: text("default_branch").notNull().default("main"),
    status: repositoryStatus("status").notNull().default("pending"),
    lastIndexedCommit: text("last_indexed_commit"),
    lastIndexedAt: timestamp("last_indexed_at", { withTimezone: true }),
    ...timestamps
  },
  (table) => [
    uniqueIndex("repositories_github_id_idx").on(table.githubRepositoryId),
    index("repositories_installation_idx").on(table.installationId),
    index("repositories_status_idx").on(table.status)
  ]
);

export const codeChunks = pgTable(
  "code_chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    language: text("language").notNull(),
    branch: text("branch").notNull(),
    commitSha: text("commit_sha").notNull(),
    contentHash: text("content_hash").notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    startLine: integer("start_line").notNull(),
    endLine: integer("end_line").notNull(),
    chunkText: text("chunk_text").notNull(),
    embedding: vector("embedding", { dimensions: 384 }).notNull(),
    active: boolean("active").notNull().default(true),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    ...timestamps
  },
  (table) => [
    uniqueIndex("code_chunks_repository_path_hash_idx").on(
      table.repositoryId,
      table.path,
      table.contentHash
    ),
    index("code_chunks_repository_active_idx").on(table.repositoryId, table.active),
    index("code_chunks_embedding_hnsw_idx")
      .using("hnsw", table.embedding.op("vector_cosine_ops"))
      .where(sql`${table.active} = true`)
  ]
);

export const pullRequests = pgTable(
  "pull_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    githubPullRequestId: text("github_pull_request_id").notNull(),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    authorLogin: text("author_login"),
    headSha: text("head_sha").notNull(),
    baseSha: text("base_sha").notNull(),
    state: text("state").notNull(),
    merged: boolean("merged").notNull().default(false),
    ...timestamps
  },
  (table) => [
    uniqueIndex("pull_requests_repository_number_idx").on(table.repositoryId, table.number),
    index("pull_requests_repository_idx").on(table.repositoryId)
  ]
);

export const reviewJobs = pgTable(
  "review_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type").notNull(),
    status: jobStatus("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps
  },
  (table) => [index("review_jobs_status_idx").on(table.status)]
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    githubDeliveryId: text("github_delivery_id").notNull(),
    eventName: text("event_name").notNull(),
    action: text("action"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    processed: boolean("processed").notNull().default(false),
    ...timestamps
  },
  (table) => [
    uniqueIndex("webhook_events_delivery_idx").on(table.githubDeliveryId),
    index("webhook_events_event_name_idx").on(table.eventName)
  ]
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pullRequestId: uuid("pull_request_id")
      .notNull()
      .references(() => pullRequests.id, { onDelete: "cascade" }),
    status: reviewStatus("status").notNull().default("pending"),
    risk: text("risk"),
    summary: text("summary"),
    findings: jsonb("findings").$type<Record<string, unknown>[]>().notNull().default([]),
    githubCommentId: text("github_comment_id"),
    errorMessage: text("error_message"),
    ...timestamps
  },
  (table) => [
    index("reviews_pull_request_idx").on(table.pullRequestId),
    index("reviews_status_idx").on(table.status)
  ]
);
