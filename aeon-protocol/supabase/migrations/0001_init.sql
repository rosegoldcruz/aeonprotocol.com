-- AEON Protocol initial schema
-- Enable needed extensions
create extension if not exists pgcrypto;
create extension if not exists uuid-ossp;

-- Users are typically managed by auth.users in Supabase.
-- We'll keep a mirror table for business data joins.
create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  delta integer not null,
  reason text not null,
  balance_after integer not null,
  created_at timestamptz not null default now()
);

create type job_status as enum ('QUEUED','RUNNING','SUCCEEDED','FAILED','CANCELED');

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('video','image','music')),
  prompt jsonb not null,
  status job_status not null default 'QUEUED',
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  provider text,
  cost_credits integer not null default 0,
  result_asset_id uuid,
  error text,
  heartbeat_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('video','image','audio','tmp')),
  url text not null,
  sha256 text not null,
  mime text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null check (provider in ('stripe','coinbase')),
  plan text not null check (plan in ('Basic','Pro','Enterprise')),
  external_id text not null,
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null check (provider in ('stripe','coinbase')),
  external_id text not null,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.webhooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  source text not null check (source in ('stripe','coinbase','clerk','custom')),
  event_type text not null,
  payload jsonb not null,
  signature text,
  received_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Simple plan credits mapping
create table if not exists public.plan_credits (
  plan text primary key,
  monthly_credits integer not null
);

-- Indexes
create index if not exists idx_jobs_user on public.jobs(user_id);
create index if not exists idx_assets_user on public.assets(user_id);
create index if not exists idx_credits_user on public.credits(user_id);
create index if not exists idx_invoices_user on public.invoices(user_id);
create index if not exists idx_subscriptions_user on public.subscriptions(user_id);

-- Row Level Security
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.credits enable row level security;
alter table public.jobs enable row level security;
alter table public.assets enable row level security;
alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;
alter table public.webhooks enable row level security;
alter table public.audit_logs enable row level security;

-- Policies: each user can SELECT/INSERT/UPDATE their own rows; service role can do all
create policy if not exists users_self_select on public.users for select using (auth.uid() = id);
create policy if not exists users_self_update on public.users for update using (auth.uid() = id);

create policy if not exists profiles_self_all on public.profiles using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists credits_self_select on public.credits for select using (auth.uid() = user_id);
-- inserts to credits will be done by service role only; restrict public inserts

create policy if not exists jobs_self_all on public.jobs using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists assets_self_all on public.assets using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists subscriptions_self_all on public.subscriptions using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists invoices_self_select on public.invoices for select using (auth.uid() = user_id);
create policy if not exists webhooks_self_select on public.webhooks for select using (user_id is not null and auth.uid() = user_id);
create policy if not exists audit_logs_self_select on public.audit_logs for select using (user_id is not null and auth.uid() = user_id);

-- Triggers to update updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at before update on public.profiles for each row execute function set_updated_at();
create trigger set_jobs_updated_at before update on public.jobs for each row execute function set_updated_at();
create trigger set_subs_updated_at before update on public.subscriptions for each row execute function set_updated_at();

-- RPC to debit credits atomically
create or replace function public.debit_credits(p_user_id uuid, p_amount int, p_reason text)
returns table (balance_after int) as $$
declare
  last_balance int;
begin
  select coalesce(sum(delta),0) into last_balance from public.credits where user_id = p_user_id;
  if last_balance < p_amount then
    raise exception 'insufficient_credits';
  end if;
  insert into public.credits (user_id, delta, reason, balance_after)
  values (p_user_id, -p_amount, p_reason, last_balance - p_amount);
  return query select last_balance - p_amount;
end;
$$ language plpgsql security definer;

-- RPC to get balance
create or replace function public.get_credits(p_user_id uuid)
returns table (balance int) as $$
begin
  return query select coalesce(sum(delta),0)::int from public.credits where user_id = p_user_id;
end;
$$ language plpgsql stable;
