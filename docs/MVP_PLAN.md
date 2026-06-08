# PatchWise MVP Plan

PatchWise is a GitHub App-based SaaS that reviews pull requests using repository-aware retrieval.

## MVP Outcome

A user installs the GitHub App on a repository. PatchWise indexes the repository, listens for pull request events, reviews changed code with retrieved repository context, and posts one summary comment on the pull request.

## Stages

### Stage 1: Project Foundation

- Fastify API server
- React + Vite dashboard
- TypeScript configuration
- Render-ready build/start scripts
- health check endpoint
- base documentation

### Stage 2: Database + Queue Setup

- PostgreSQL connection
- `pgvector` extension setup
- Drizzle schema and migrations
- Upstash Redis connection
- BullMQ queue and worker loop

### Stage 3: GitHub App Integration

- GitHub webhook endpoint
- webhook signature verification
- installation event handling
- repository storage
- Octokit installation client

### Stage 4: Repository Indexing

- fetch default branch file tree
- filter supported files
- chunk source and documentation files
- create embeddings
- store chunks in `pgvector`

### Stage 5: Pull Request Review

- handle PR opened and synchronized events
- fetch changed files and diffs
- retrieve relevant chunks
- call Groq for review generation
- post one summary comment on GitHub

### Stage 6: Merge Re-Indexing

- detect merged PRs
- re-index changed files
- deactivate chunks for deleted files
- update repository index metadata

### Stage 7: Minimal Dashboard

- repository list
- indexing status
- recent review list
- review detail view

### Stage 8: Render Deployment

- deploy web service
- configure environment variables
- connect database and Redis
- update GitHub App webhook URL

## MVP Constraints

- one Render web service
- external Postgres
- external Redis
- one summary PR comment
- no inline comments in v1
- no user-provided LLM keys in v1
- no billing in v1
- no multi-tenant team features in v1
