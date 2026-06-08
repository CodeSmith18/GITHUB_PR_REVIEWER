# PatchWise

PatchWise is a lightweight GitHub App that reviews pull requests with repository-aware AI.

The MVP is designed for a small Render deployment:

- one Node.js web service
- one PostgreSQL database with `pgvector` in Stage 2
- one external Redis queue in Stage 2
- Groq for PR review generation in later stages

## Current Status

Stage 2 is the database and queue setup:

- PostgreSQL and Drizzle schema
- `pgvector` migration for code embeddings
- BullMQ queue configuration
- Redis/Upstash connection settings
- infrastructure health endpoint
- sample background job endpoint

## Local Development

Install dependencies:

```bash
npm install
```

Run the API server:

```bash
npm run dev
```

Run the dashboard dev server:

```bash
npm run dev:web
```

Build for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Health Check

```text
GET /health
```

Expected response:

```json
{
  "status": "ok",
  "service": "patchwise-api"
}
```

## Infrastructure Check

```text
GET /api/infrastructure
```

This endpoint reports whether Postgres and Redis are configured and reachable.

## Documentation

- [MVP plan](docs/MVP_PLAN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Stage 1 notes](docs/STAGE_1_FOUNDATION.md)
- [Stage 2 notes](docs/STAGE_2_DATABASE_QUEUE.md)
