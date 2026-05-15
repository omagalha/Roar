create table if not exists public.worker_runs (
  id uuid primary key default gen_random_uuid(),
  worker_name text not null,
  status text not null,
  checked_count integer not null default 0,
  goal_count integer not null default 0,
  push_count integer not null default 0,
  error_message text,
  duration_ms integer,
  created_at timestamptz not null default now(),
  constraint worker_runs_status_check check (status in ('ok', 'error'))
);

create index if not exists worker_runs_worker_created_at_idx
  on public.worker_runs (worker_name, created_at desc);

alter table public.worker_runs enable row level security;

drop policy if exists "worker runs are readable" on public.worker_runs;
create policy "worker runs are readable" on public.worker_runs
for select using (true);

create or replace view public.mvp_launch_check as
select
  (select count(*) from public.matches where status in ('LIVE', 'HT')) as live_matches,
  (select count(*) from public.live_events where created_at > now() - interval '1 hour') as events_last_hour,
  (select count(*) from public.live_events where event_type = 'goal' and created_at > now() - interval '1 hour') as goals_last_hour,
  (select count(*) from public.reactions where upload_status = 'ready' and created_at > now() - interval '1 hour') as reactions_last_hour,
  (select count(*) from public.match_subscriptions where push_enabled) as active_push_subscriptions,
  (
    select created_at
    from public.worker_runs
    where worker_name in ('goal-worker', 'simulate-goal')
    order by created_at desc
    limit 1
  ) as latest_worker_run_at,
  (
    select status
    from public.worker_runs
    where worker_name in ('goal-worker', 'simulate-goal')
    order by created_at desc
    limit 1
  ) as latest_worker_status;

create or replace view public.match_room_health as
select
  m.id as match_id,
  m.status,
  m.home_goals,
  m.away_goals,
  count(distinct le.id) as live_events,
  count(distinct r.id) filter (where r.upload_status = 'ready' and r.moderation_status = 'visible') as visible_reactions,
  count(distinct ms.id) filter (where ms.push_enabled) as push_subscriptions,
  max(le.created_at) as latest_event_at,
  max(r.created_at) as latest_reaction_at
from public.matches m
left join public.live_events le on le.match_id = m.id
left join public.reactions r on r.match_id = m.id
left join public.match_subscriptions ms on ms.match_id = m.id
group by m.id, m.status, m.home_goals, m.away_goals;
