create table if not exists public.match_goal_state (
  match_id text primary key,
  home_goals integer not null default 0,
  away_goals integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.live_events (
  id uuid primary key default gen_random_uuid(),
  match_id text not null,
  external_event_id text not null unique,
  event_type text not null,
  team_id text,
  team_name text,
  minute integer,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists live_events_match_id_created_at_idx
  on public.live_events (match_id, created_at desc);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.live_events;
  end if;
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.match_subscriptions (
  id uuid primary key default gen_random_uuid(),
  match_id text not null,
  user_id uuid,
  expo_push_token text not null,
  push_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (match_id, expo_push_token)
);

create index if not exists match_subscriptions_match_id_idx
  on public.match_subscriptions (match_id)
  where push_enabled = true;

create or replace function public.touch_match_goal_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists match_goal_state_touch_updated_at on public.match_goal_state;

create trigger match_goal_state_touch_updated_at
before update on public.match_goal_state
for each row
execute function public.touch_match_goal_state_updated_at();
