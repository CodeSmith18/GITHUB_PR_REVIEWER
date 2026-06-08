# PatchWise Architecture

PatchWise is intentionally light for the MVP. It uses one web service, one database, and one external queue.

## Stage 1 Architecture

```mermaid
flowchart TD
  A["Browser"] --> B["Fastify Web Service"]
  B --> C["Health API"]
  B --> D["Static React Dashboard"]
```

## Stage 2 Architecture

```mermaid
flowchart TD
  A["Browser or API Client"] --> B["Fastify Web Service"]
  B --> C["Health API"]
  B --> D["Infrastructure API"]
  D --> E["PostgreSQL + pgvector"]
  D --> F["BullMQ Queue"]
  F --> G["Redis / Upstash"]
  B --> H["In-process Worker"]
  H --> F
```

## Target MVP Architecture

```mermaid
flowchart TD
  A["GitHub App"] --> B["Render Web Service"]
  B --> C["Fastify API"]
  C --> D["Postgres + pgvector"]
  C --> E["Upstash Redis Queue"]

  E --> F["In-process Worker"]
  F --> G["GitHub API"]
  F --> H["Embeddings"]
  F --> I["Groq Review Model"]
  F --> J["GitHub PR Comment"]
```

## Responsibilities

### Fastify API

- receives GitHub webhooks
- verifies signatures
- creates background jobs
- serves dashboard APIs
- serves the built React dashboard
- reports database and queue health

### Worker

- indexes repositories
- reviews pull requests
- updates repository vectors after merge
- processes BullMQ jobs inside the same Render web service for the MVP

### PostgreSQL + pgvector

- stores installations
- stores repositories
- stores review history
- stores code chunks and embeddings
- uses `vector(384)` for the first lightweight embedding path

### Upstash Redis

- stores lightweight background jobs
- prevents webhook requests from doing slow work
- can be configured with either `REDIS_URL` or split Upstash host/port/password variables

### Groq

- generates the pull request review summary

## Render Deployment Shape

```text
Render Web Service
  npm install
  npm run build
  npm start

External services
  PostgreSQL with pgvector
  Upstash Redis
  Groq API
```
