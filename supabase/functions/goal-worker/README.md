# Goal Worker

Polls API-Football live fixtures, detects score changes, writes `live_events`, and sends Expo push notifications to users subscribed to the `match_id`.

## Environment

Set these secrets for the function:

```sh
supabase secrets set SUPABASE_URL=...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set API_FOOTBALL_KEY=...
```

Optional:

```sh
supabase secrets set API_FOOTBALL_HOST=v3.football.api-sports.io
supabase secrets set API_FOOTBALL_AUTH_HEADER=x-apisports-key
supabase secrets set WORKER_CRON_SECRET=...
```

## Deploy

```sh
supabase functions deploy goal-worker
supabase db push
```

Run it from a cron/scheduler every 15 to 30 seconds during live match windows, or every minute for the first MVP. If `WORKER_CRON_SECRET` is set, call the function with `Authorization: Bearer <secret>`.

## Tables

The migration creates:

- `match_goal_state`: last seen score by API-Football fixture id.
- `live_events`: append-only event feed for Supabase Realtime by `match_id`.
- `match_subscriptions`: Expo tokens subscribed to match push notifications.

Add a unique `external_event_id` constraint to any existing `live_events` table if you merge this into a current schema.
