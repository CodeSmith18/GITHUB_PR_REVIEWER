# Stage 2: Database + Queue Setup

## Goal

Add the persistence and background job foundation needed before GitHub webhooks arrive in Stage 3.

## Built In This Stage

- Drizzle ORM configuration
- PostgreSQL schema for installations, repositories, code chunks, PRs, jobs, webhooks, and reviews
- `pgvector` migration with `vector(384)` embeddings
- BullMQ queue setup
- Redis/Upstash configuration support
- in-process worker for the lightweight Render MVP
- infrastructure health endpoint at `GET /api/infrastructure`
- sample queue endpoint at `POST /api/jobs/infrastructure-check`

## Environment Variables

```env
DATABASE_URL=postgres://patchwise:patchwise@localhost:5432/patchwise

REDIS_URL=rediss://default:password@your-upstash-host.upstash.io:6379
```

Alternatively, Redis can be configured with split Upstash-style values:

```env
UPSTASH_REDIS_HOST=your-upstash-host.upstash.io
UPSTASH_REDIS_PORT=6379
UPSTASH_REDIS_PASSWORD=your-password
UPSTASH_REDIS_TLS=true
```

## Database

The first migration is:

```text
drizzle/0001_stage_2_foundation.sql
```

It creates:

- `github_installations`
- `repositories`
- `code_chunks`
- `pull_requests`
- `review_jobs`
- `webhook_events`
- `reviews`

The `code_chunks` table stores embeddings as:

```sql
embedding vector(384) NOT NULL
```

Stage 4 will decide the exact lightweight embedding model. The schema is already ready for a 384-dimension local embedding path.

## Queue

The MVP uses BullMQ with Redis. On Render, the worker runs in the same Node process as the Fastify API to keep deployment light.

Current queue:

```text
patchwise-background
```

Current job:

```text
infrastructure_check
```

## Local Redis Setup

You have three local options.

### Option 1: No Redis

This is enough for simple Stage 2 API smoke tests.

Leave Redis variables empty. The server still starts, and `GET /api/infrastructure` reports:

```json
{
  "queue": {
    "status": "not_configured"
  }
}
```

### Option 2: Local Docker Redis

Use this when you want to test BullMQ jobs locally.

```bash
docker run --name patchwise-redis -p 6379:6379 redis:7-alpine
```

Then set:

```env
REDIS_URL=redis://127.0.0.1:6379
```

Test the queue:

```bash
curl -X POST http://127.0.0.1:3000/api/jobs/infrastructure-check
```

### Option 3: Upstash Free Redis

Use this when you want local behavior to match the Render deployment more closely.

Set only `REDIS_URL`:

```env
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379
```

Or use the split values:

```env
UPSTASH_REDIS_HOST=YOUR_HOST.upstash.io
UPSTASH_REDIS_PORT=6379
UPSTASH_REDIS_PASSWORD=YOUR_PASSWORD
UPSTASH_REDIS_TLS=true
```

For development, Docker Redis is easiest. For deployed Render testing, Upstash is the better match.

## Verification Checklist

- `npm install` completed after adding Stage 2 dependencies
- `npm run typecheck` passed
- `npm run build` passed
- production server launched locally
- `GET /health` returned an ok response
- `GET /api/stage` returned Stage 2 metadata
- `GET /api/infrastructure` returned database and queue status
- `npm audit --omit=dev` found 0 production vulnerabilities

Local verification can run without `DATABASE_URL` or Redis variables. In that case, the infrastructure endpoint reports `not_configured` for those services instead of failing the app.

## Notes For Stage 3

Stage 3 will add:

- GitHub App environment variables
- webhook endpoint
- webhook signature verification
- installation event persistence
- repository persistence
- Octokit installation client

Before Stage 3 starts, manually prepare:

- GitHub App ID
- GitHub App private key
- GitHub webhook secret
- local webhook forwarding URL, usually from `ngrok` or a similar tunnel
