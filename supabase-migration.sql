-- =============================================================================
-- SignalIQ Database Schema
-- Run this once in the Supabase SQL Editor
-- =============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- =============================================================================
-- Tables
-- =============================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  business_name text not null default '',
  offer_text text not null default '',
  plan text not null default 'starter' check (plan in ('starter', 'pro', 'agency')),
  gen_count integer not null default 0,
  hunter_api_key text,
  pdl_api_key text,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.target_industries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.target_titles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.prospects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  company text not null,
  title text,
  email text,
  phone text,
  linkedin_url text,
  industry text,
  location text,
  signal_text text,
  signal_strength text not null default 'warm' check (signal_strength in ('hot', 'warm', 'trigger')),
  stage text not null default 'new' check (stage in ('new', 'contacted', 'meeting', 'proposal', 'closed')),
  brief text,
  emails text,
  script text,
  notes text,
  priority text check (priority in ('high', 'medium', 'low')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.signals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  snippet text,
  source_url text not null,
  signal_type text not null default 'warm' check (signal_type in ('hot', 'warm', 'trigger')),
  score integer not null default 0,
  dismissed boolean not null default false,
  converted boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.activity_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

create index idx_prospects_user_id on public.prospects(user_id);
create index idx_prospects_stage on public.prospects(stage);
create index idx_prospects_signal_strength on public.prospects(signal_strength);
create index idx_signals_user_id on public.signals(user_id);
create index idx_signals_dismissed on public.signals(dismissed);
create index idx_activity_log_user_id on public.activity_log(user_id);
create index idx_target_industries_user_id on public.target_industries(user_id);
create index idx_target_titles_user_id on public.target_titles(user_id);
create unique index idx_signals_source_url on public.signals(user_id, source_url);

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.target_industries enable row level security;
alter table public.target_titles enable row level security;
alter table public.prospects enable row level security;
alter table public.signals enable row level security;
alter table public.activity_log enable row level security;

-- Profiles: users can only read/write their own profile
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Target industries: users can only manage their own
create policy "Users can manage own target industries"
  on public.target_industries for all using (auth.uid() = user_id);

-- Target titles: users can only manage their own
create policy "Users can manage own target titles"
  on public.target_titles for all using (auth.uid() = user_id);

-- Prospects: users can only manage their own
create policy "Users can manage own prospects"
  on public.prospects for all using (auth.uid() = user_id);

-- Signals: users can only manage their own
create policy "Users can manage own signals"
  on public.signals for all using (auth.uid() = user_id);

-- Activity log: users can only view/create their own
create policy "Users can manage own activity log"
  on public.activity_log for all using (auth.uid() = user_id);

-- =============================================================================
-- Triggers
-- =============================================================================

-- Auto-update updated_at on profiles
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger on_prospect_updated
  before update on public.prospects
  for each row execute function public.handle_updated_at();

-- Auto-create profile on user signup (safety net)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Optional: Monthly gen_count reset via pg_cron
-- Uncomment if pg_cron is enabled on your Supabase instance
-- =============================================================================
-- select cron.schedule(
--   'reset-monthly-gen-count',
--   '0 0 1 * *',
--   $$update public.profiles set gen_count = 0$$
-- );
