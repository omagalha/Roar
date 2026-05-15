# Simulate Goal

Sprint 2 test function. It creates the same `goal` event shape as `goal-worker`, updates the match score, and sends Expo push notifications to subscribers.

Use this when there is no live match or API-Football key available.

```sh
curl -X POST "$SUPABASE_URL/functions/v1/simulate-goal" \
  -H "Authorization: Bearer $WORKER_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"match_id":"<match-id>","side":"home","minute":35}'
```

Request body:

- `match_id`: app-facing `matches.id`.
- `side`: `home` or `away`, defaults to `home`.
- `minute`: optional match minute.
