create table if not exists web_enhancements(
  id uuid primary key,
  user_id text not null,
  raw text not null,
  webspec_json jsonb not null,
  created_at timestamptz not null default now(),
  committed_at timestamptz,
  project_id uuid
);

create table if not exists web_projects(
  id uuid primary key,
  user_id text not null,
  webspec_json jsonb not null,
  status text not null default 'queued',
  artifact_url text,
  preview_url text,
  deploy_log text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

