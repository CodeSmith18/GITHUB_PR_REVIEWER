CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE repository_status AS ENUM ('pending', 'indexing', 'indexed', 'failed');
CREATE TYPE job_status AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE review_status AS ENUM ('pending', 'running', 'completed', 'failed');

CREATE TABLE github_installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  github_installation_id text NOT NULL,
  account_login text NOT NULL,
  account_type text NOT NULL,
  suspended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id uuid NOT NULL REFERENCES github_installations(id) ON DELETE cascade,
  github_repository_id text NOT NULL,
  owner text NOT NULL,
  name text NOT NULL,
  full_name text NOT NULL,
  default_branch text NOT NULL DEFAULT 'main',
  status repository_status NOT NULL DEFAULT 'pending',
  last_indexed_commit text,
  last_indexed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE code_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid NOT NULL REFERENCES repositories(id) ON DELETE cascade,
  path text NOT NULL,
  language text NOT NULL,
  branch text NOT NULL,
  commit_sha text NOT NULL,
  content_hash text NOT NULL,
  chunk_index integer NOT NULL,
  start_line integer NOT NULL,
  end_line integer NOT NULL,
  chunk_text text NOT NULL,
  embedding vector(384) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pull_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid NOT NULL REFERENCES repositories(id) ON DELETE cascade,
  github_pull_request_id text NOT NULL,
  number integer NOT NULL,
  title text NOT NULL,
  author_login text,
  head_sha text NOT NULL,
  base_sha text NOT NULL,
  state text NOT NULL,
  merged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE review_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  status job_status NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  github_delivery_id text NOT NULL,
  event_name text NOT NULL,
  action text,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pull_request_id uuid NOT NULL REFERENCES pull_requests(id) ON DELETE cascade,
  status review_status NOT NULL DEFAULT 'pending',
  risk text,
  summary text,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  github_comment_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX github_installations_github_id_idx
  ON github_installations(github_installation_id);

CREATE UNIQUE INDEX repositories_github_id_idx
  ON repositories(github_repository_id);

CREATE INDEX repositories_installation_idx
  ON repositories(installation_id);

CREATE INDEX repositories_status_idx
  ON repositories(status);

CREATE UNIQUE INDEX code_chunks_repository_path_hash_idx
  ON code_chunks(repository_id, path, content_hash);

CREATE INDEX code_chunks_repository_active_idx
  ON code_chunks(repository_id, active);

CREATE INDEX code_chunks_embedding_hnsw_idx
  ON code_chunks USING hnsw (embedding vector_cosine_ops)
  WHERE active = true;

CREATE UNIQUE INDEX pull_requests_repository_number_idx
  ON pull_requests(repository_id, number);

CREATE INDEX pull_requests_repository_idx
  ON pull_requests(repository_id);

CREATE INDEX review_jobs_status_idx
  ON review_jobs(status);

CREATE UNIQUE INDEX webhook_events_delivery_idx
  ON webhook_events(github_delivery_id);

CREATE INDEX webhook_events_event_name_idx
  ON webhook_events(event_name);

CREATE INDEX reviews_pull_request_idx
  ON reviews(pull_request_id);

CREATE INDEX reviews_status_idx
  ON reviews(status);
