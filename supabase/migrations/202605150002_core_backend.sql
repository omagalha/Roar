create table if not exists public.teams (
  id text primary key,
  name text not null,
  country text not null default '',
  badge_url text
);

create table if not exists public.matches (
  id text primary key default gen_random_uuid()::text,
  external_fixture_id integer not null unique,
  home_team_id text not null references public.teams(id),
  away_team_id text not null references public.teams(id),
  starts_at timestamptz not null,
  status text not null default 'NS',
  home_goals integer not null default 0,
  away_goals integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_status_check check (status in ('NS', 'LIVE', 'HT', 'FT', 'PST', 'CANC'))
);

create index if not exists matches_starts_at_idx on public.matches (starts_at);
create index if not exists matches_status_starts_at_idx on public.matches (status, starts_at);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  avatar_url text,
  team_id text references public.teams(id),
  created_at timestamptz not null default now(),
  constraint profiles_username_length check (char_length(username) between 3 and 30),
  constraint profiles_username_format check (username ~ '^[a-zA-Z0-9_]+$')
);

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null,
  platform text not null,
  device_id text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token),
  constraint push_tokens_platform_check check (platform in ('ios', 'android', 'web'))
);

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid references public.live_events(id) on delete set null,
  video_url text not null,
  thumbnail_url text,
  duration_ms integer not null,
  score integer not null default 0,
  created_at timestamptz not null default now(),
  constraint reactions_duration_check check (duration_ms between 1000 and 20000)
);

create index if not exists reactions_match_id_created_at_idx
  on public.reactions (match_id, created_at desc);

create index if not exists reactions_match_id_score_idx
  on public.reactions (match_id, score desc, created_at desc);

create table if not exists public.reaction_likes (
  reaction_id uuid not null references public.reactions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reaction_id, user_id)
);

create index if not exists reaction_likes_user_id_idx on public.reaction_likes (user_id);

alter table public.match_subscriptions
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists match_subscriptions_user_match_idx
  on public.match_subscriptions (user_id, match_id)
  where user_id is not null;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists matches_touch_updated_at on public.matches;
create trigger matches_touch_updated_at
before update on public.matches
for each row execute function public.touch_updated_at();

drop trigger if exists push_tokens_touch_updated_at on public.push_tokens;
create trigger push_tokens_touch_updated_at
before update on public.push_tokens
for each row execute function public.touch_updated_at();

drop trigger if exists match_subscriptions_touch_updated_at on public.match_subscriptions;
create trigger match_subscriptions_touch_updated_at
before update on public.match_subscriptions
for each row execute function public.touch_updated_at();

create or replace function public.increment_reaction_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reactions
  set score = score + 1
  where id = new.reaction_id;

  return new;
end;
$$;

create or replace function public.decrement_reaction_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reactions
  set score = greatest(score - 1, 0)
  where id = old.reaction_id;

  return old;
end;
$$;

drop trigger if exists reaction_likes_increment_score on public.reaction_likes;
create trigger reaction_likes_increment_score
after insert on public.reaction_likes
for each row execute function public.increment_reaction_score();

drop trigger if exists reaction_likes_decrement_score on public.reaction_likes;
create trigger reaction_likes_decrement_score
after delete on public.reaction_likes
for each row execute function public.decrement_reaction_score();

create or replace function public.upsert_push_token(
  token text,
  token_platform text,
  token_device_id text default null
)
returns public.push_tokens
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.push_tokens;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.push_tokens (user_id, expo_push_token, platform, device_id, enabled)
  values (auth.uid(), token, token_platform, token_device_id, true)
  on conflict (user_id, expo_push_token)
  do update set
    platform = excluded.platform,
    device_id = excluded.device_id,
    enabled = true,
    updated_at = now()
  returning * into row;

  return row;
end;
$$;

create or replace function public.subscribe_to_match(
  target_match_id text,
  token text
)
returns public.match_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.match_subscriptions;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.match_subscriptions (match_id, user_id, expo_push_token, push_enabled)
  values (target_match_id, auth.uid(), token, true)
  on conflict (match_id, expo_push_token)
  do update set
    user_id = excluded.user_id,
    push_enabled = true,
    updated_at = now()
  returning * into row;

  return row;
end;
$$;

create or replace function public.unsubscribe_from_match(target_match_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.match_subscriptions
  set push_enabled = false,
      updated_at = now()
  where match_id = target_match_id
    and user_id = auth.uid();
end;
$$;

create or replace function public.create_reaction(
  target_match_id text,
  target_event_id uuid,
  target_video_url text,
  target_thumbnail_url text,
  target_duration_ms integer
)
returns public.reactions
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.reactions;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.reactions (
    match_id,
    user_id,
    event_id,
    video_url,
    thumbnail_url,
    duration_ms
  )
  values (
    target_match_id,
    auth.uid(),
    target_event_id,
    target_video_url,
    target_thumbnail_url,
    target_duration_ms
  )
  returning * into row;

  insert into public.live_events (
    match_id,
    external_event_id,
    event_type,
    payload
  )
  values (
    target_match_id,
    'reaction:' || row.id,
    'reaction_created',
    jsonb_build_object('reaction_id', row.id, 'user_id', auth.uid())
  )
  on conflict (external_event_id) do nothing;

  return row;
end;
$$;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.reactions;
    alter publication supabase_realtime add table public.reaction_likes;
  end if;
exception
  when duplicate_object then null;
end;
$$;

alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.profiles enable row level security;
alter table public.live_events enable row level security;
alter table public.reactions enable row level security;
alter table public.reaction_likes enable row level security;
alter table public.match_subscriptions enable row level security;
alter table public.push_tokens enable row level security;
alter table public.match_goal_state enable row level security;

drop policy if exists "teams are readable" on public.teams;
create policy "teams are readable" on public.teams
for select using (true);

drop policy if exists "matches are readable" on public.matches;
create policy "matches are readable" on public.matches
for select using (true);

drop policy if exists "profiles are readable" on public.profiles;
create policy "profiles are readable" on public.profiles
for select using (true);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles
for insert with check (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "live events are readable" on public.live_events;
create policy "live events are readable" on public.live_events
for select using (true);

drop policy if exists "reactions are readable" on public.reactions;
create policy "reactions are readable" on public.reactions
for select using (true);

drop policy if exists "users insert own reactions" on public.reactions;
create policy "users insert own reactions" on public.reactions
for insert with check (auth.uid() = user_id);

drop policy if exists "users update own reactions" on public.reactions;
create policy "users update own reactions" on public.reactions
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reaction likes are readable" on public.reaction_likes;
create policy "reaction likes are readable" on public.reaction_likes
for select using (true);

drop policy if exists "users insert own likes" on public.reaction_likes;
create policy "users insert own likes" on public.reaction_likes
for insert with check (auth.uid() = user_id);

drop policy if exists "users delete own likes" on public.reaction_likes;
create policy "users delete own likes" on public.reaction_likes
for delete using (auth.uid() = user_id);

drop policy if exists "users read own match subscriptions" on public.match_subscriptions;
create policy "users read own match subscriptions" on public.match_subscriptions
for select using (auth.uid() = user_id);

drop policy if exists "users manage own match subscriptions" on public.match_subscriptions;
create policy "users manage own match subscriptions" on public.match_subscriptions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users manage own push tokens" on public.push_tokens;
create policy "users manage own push tokens" on public.push_tokens
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
