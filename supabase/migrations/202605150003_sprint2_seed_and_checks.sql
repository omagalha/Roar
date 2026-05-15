insert into public.teams (id, name, country, badge_url)
values
  ('br', 'Brasil', 'BR', null),
  ('ar', 'Argentina', 'AR', null),
  ('fr', 'Franca', 'FR', null),
  ('de', 'Alemanha', 'DE', null)
on conflict (id) do update set
  name = excluded.name,
  country = excluded.country,
  badge_url = excluded.badge_url;

insert into public.matches (
  id,
  external_fixture_id,
  home_team_id,
  away_team_id,
  starts_at,
  status,
  home_goals,
  away_goals
)
values
  ('sprint2-br-ar', 900001, 'br', 'ar', now() - interval '35 minutes', 'LIVE', 0, 0),
  ('sprint2-fr-de', 900002, 'fr', 'de', now() + interval '90 minutes', 'NS', 0, 0)
on conflict (external_fixture_id) do update set
  home_team_id = excluded.home_team_id,
  away_team_id = excluded.away_team_id,
  starts_at = excluded.starts_at,
  status = excluded.status,
  home_goals = excluded.home_goals,
  away_goals = excluded.away_goals;

create or replace view public.sprint2_goal_live_check as
select
  m.id as match_id,
  m.status,
  m.home_goals,
  m.away_goals,
  ht.name as home_team,
  at.name as away_team,
  count(le.id) filter (where le.event_type = 'goal') as goal_events,
  count(ms.id) filter (where ms.push_enabled) as push_subscriptions
from public.matches m
join public.teams ht on ht.id = m.home_team_id
join public.teams at on at.id = m.away_team_id
left join public.live_events le on le.match_id = m.id
left join public.match_subscriptions ms on ms.match_id = m.id
where m.id in ('sprint2-br-ar', 'sprint2-fr-de')
group by m.id, m.status, m.home_goals, m.away_goals, ht.name, at.name;
