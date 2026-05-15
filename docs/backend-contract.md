# ROAR Backend Contract

This is the contract the mobile app can build against while the backend evolves.

## IDs

- `matches.id` is the app-facing match id.
- `matches.external_fixture_id` is the API-Football fixture id.
- `match_goal_state.match_id` stores the external fixture id as text for worker idempotency.
- `live_events.match_id`, `reactions.match_id`, and `match_subscriptions.match_id` use `matches.id`.

## Core Tables

### `teams`

Readable by everyone.

- `id: string`
- `name: string`
- `country: string`
- `badge_url: string | null`

### `matches`

Readable by everyone.

- `id: string`
- `external_fixture_id: number`
- `home_team_id: string`
- `away_team_id: string`
- `starts_at: string`
- `status: 'NS' | 'LIVE' | 'HT' | 'FT' | 'PST' | 'CANC'`
- `home_goals: number`
- `away_goals: number`

### `live_events`

Append-only event stream. The app subscribes by `match_id`.

- `id: string`
- `match_id: string`
- `external_event_id: string`
- `event_type: 'goal' | 'kickoff' | 'halftime' | 'fulltime' | 'reaction_created'`
- `team_id: string | null`
- `team_name: string | null`
- `minute: number | null`
- `payload: Json`
- `created_at: string`

Goal payload:

```ts
type GoalPayload = {
  side: 'home' | 'away'
  goal_number: number
  league: string | null
  score: { home: number; away: number }
  teams: { home: string; away: string }
}
```

### `reactions`

Readable by everyone. Users can create their own reactions.

- `id: string`
- `match_id: string`
- `user_id: string`
- `event_id: string | null`
- `video_url: string`
- `thumbnail_url: string | null`
- `duration_ms: number`
- `storage_path: string | null`
- `mime_type: string`
- `upload_status: 'uploading' | 'ready' | 'failed'`
- `moderation_status: 'visible' | 'hidden' | 'flagged'`
- `published_at: string`
- `score: number`
- `created_at: string`

### `reaction_likes`

Primary key: `(reaction_id, user_id)`.

- Insert to like.
- Delete to unlike.
- Trigger updates `reactions.score`.

### `push_tokens`

Private per user.

- `expo_push_token: string`
- `platform: 'ios' | 'android' | 'web'`
- `device_id: string | null`
- `enabled: boolean`

### `match_subscriptions`

Private per user. The worker reads it with the service role key.

- `match_id: string`
- `user_id: string | null`
- `expo_push_token: string`
- `push_enabled: boolean`

## RPCs for Mobile

### `upsert_push_token`

Use after notification permission is granted.

```ts
await supabase.rpc('upsert_push_token', {
  token: expoPushToken,
  token_platform: Platform.OS,
  token_device_id: deviceId ?? null,
})
```

### `subscribe_to_match`

Use when the user follows or opens push for a match.

```ts
await supabase.rpc('subscribe_to_match', {
  target_match_id: matchId,
  token: expoPushToken,
})
```

### `unsubscribe_from_match`

```ts
await supabase.rpc('unsubscribe_from_match', {
  target_match_id: matchId,
})
```

### `create_reaction`

Use after upload succeeds.

```ts
await supabase.rpc('create_reaction', {
  target_match_id: matchId,
  target_event_id: liveEventId,
  target_video_url: videoUrl,
  target_thumbnail_url: thumbnailUrl,
  target_duration_ms: durationMs,
  target_storage_path: storagePath,
  target_mime_type: 'video/mp4',
})
```

This inserts into `reactions` and also emits a `live_events` row with `event_type = 'reaction_created'`.

## Storage

Bucket:

- `reactions`

Path convention:

```txt
<match_id>/<user_id>/<timestamp>.mp4
```

The bucket is public for reads during the MVP. Authenticated users can upload, update, and delete only files where the second path segment matches their `auth.uid()`.

## Realtime Channels

### Live Events

```ts
supabase
  .channel(`match:${matchId}:events`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'live_events',
      filter: `match_id=eq.${matchId}`,
    },
    onEvent,
  )
  .subscribe()
```

### Feed

```ts
supabase
  .channel(`match:${matchId}:feed`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'reactions',
      filter: `match_id=eq.${matchId}`,
    },
    onReaction,
  )
  .subscribe()
```

### Presence

```ts
const channel = supabase.channel(`match:${matchId}:presence`, {
  config: { presence: { key: userId } },
})
```

Recommended presence payload:

```ts
{
  user_id: string
  team_id: string | null
  mode: 'watching' | 'recording' | 'posting'
}
```

## Operational Health

Function:

- `supabase/functions/mvp-health/index.ts`

Views:

- `mvp_launch_check`
- `match_room_health`

Worker telemetry:

- `worker_runs`

Manual check:

```sh
curl "$SUPABASE_URL/functions/v1/mvp-health" \
  -H "Authorization: Bearer $WORKER_CRON_SECRET"
```

## Push Payload

The goal worker sends:

```ts
{
  match_id: string
  event_id: string
  type: 'goal'
}
```

Frontend behavior:

- If app is foregrounded: show in-app goal state and camera CTA.
- If app is backgrounded and notification is tapped: open `/match/[match_id]/camera?event_id=...`.

## Worker

Path:

- `supabase/functions/goal-worker/index.ts`
- `supabase/functions/simulate-goal/index.ts`

Required secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `API_FOOTBALL_KEY`

Optional secrets:

- `API_FOOTBALL_HOST`
- `API_FOOTBALL_AUTH_HEADER`
- `WORKER_CRON_SECRET`

Recommended schedule:

- Every 15 to 30 seconds during live match windows.
- Every 60 seconds outside active windows if needed.

## Sprint 2 Test Match

The Sprint 2 seed migration creates:

- `sprint2-br-ar`: Brasil vs Argentina, live.
- `sprint2-fr-de`: Franca vs Alemanha, scheduled.

To test the full goal flow without API-Football:

```sh
curl -X POST "$SUPABASE_URL/functions/v1/simulate-goal" \
  -H "Authorization: Bearer $WORKER_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"match_id":"sprint2-br-ar","side":"home","minute":36}'
```

Expected result:

- `matches.home_goals` increments.
- `live_events` receives a `goal` row.
- Supabase Realtime emits the event for `match:sprint2-br-ar:events`.
- Expo Push is sent to enabled rows in `match_subscriptions`.
