# PatchWise Architecture

PatchWise is intentionally light for the MVP. It uses one web service, one database, and one external queue.

## Stage 1 Architecture

```mermaid
flowchart TD
  A["Browser"] --> B["Fastify Web Service"]
  B --> C["Health API"]
  B --> D["Static React Dashboard"]
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

### Worker

- indexes repositories
- reviews pull requests
- updates repository vectors after merge

### PostgreSQL + pgvector

- stores installations
- stores repositories
- stores review history
- stores code chunks and embeddings

### Upstash Redis

- stores lightweight background jobs
- prevents webhook requests from doing slow work

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
