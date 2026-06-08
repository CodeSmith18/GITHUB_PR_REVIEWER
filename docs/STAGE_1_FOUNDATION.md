# Stage 1: Project Foundation

## Goal

Create a small deployable foundation for PatchWise before adding GitHub, database, queue, or AI logic.

## Built In This Stage

- Fastify API server
- health check endpoint at `GET /health`
- stage status endpoint at `GET /api/stage`
- React + Vite dashboard
- TypeScript configs for frontend and server
- production build that serves the dashboard from Fastify
- Render-friendly scripts
- `.env.example`

## Verification Checklist

- `npm install` completed
- `npm run typecheck` passed
- `npm run build` passed
- `npm start` launched the production server
- `GET /health` returned an ok response
- `GET /api/stage` returned Stage 1 metadata
- dashboard HTML loaded from the production server

Local verification used `HOST=127.0.0.1` because this Codex sandbox blocks binding to `0.0.0.0`. Render should keep the default `HOST=0.0.0.0`.

## Notes For Stage 2

Stage 2 will add the first real infrastructure pieces:

- PostgreSQL connection
- Drizzle schema
- `pgvector`
- Upstash Redis
- BullMQ queue
