# ROAR

Real-time reaction app for World Cup 2026. Users receive an instant push notification when a goal is scored, open the camera, record a 10–15 second reaction, and see it appear in a live feed — synchronized to match events.

**Target event:** FIFA World Cup 2026 — June 11 to July 19, 2026.

---

## Stack

| Layer | Tech |
|---|---|
| Mobile | React Native 0.81 + Expo 54 |
| Navigation | Expo Router 6 (file-based) |
| State | Zustand + React Query |
| Backend | Supabase (Postgres, Auth, Realtime, Storage) |
| Edge Functions | Deno (Supabase Edge Functions) |
| Live scores | API-Football (api-sports.io) |
| Push notifications | Expo Notifications |
| Language | TypeScript 5.9 |

---

## Project Structure

```
roar/
├── mobile/               # Expo app
│   ├── app/              # Expo Router screens
│   │   ├── (auth)/       # Login
│   │   ├── (tabs)/       # Home, Feed, Profile
│   │   ├── match/        # Live match room
│   │   ├── feed/         # Match reaction feed
│   │   ├── camera/       # Camera recording modal
│   │   └── onboarding.tsx
│   └── src/
│       ├── components/   # UI components
│       ├── hooks/        # Data fetching & realtime hooks
│       ├── lib/          # Supabase client, notifications, theme
│       ├── state/        # Zustand stores
│       └── types/        # TypeScript types from Supabase schema
├── supabase/
│   ├── functions/        # Edge Functions (Deno)
│   │   ├── goal-worker/  # Polls API-Football, detects goals, fires push
│   │   └── simulate-goal/# Goal simulation for testing
│   └── migrations/       # SQL migrations (ordered)
└── docs/                 # Architecture plan + sprint runbooks
```

---

## Key Features

- **Goal detection** — Edge Function polls API-Football, writes to `live_events`, triggers push to subscribed users
- **Push → Camera** — Deep link opens the camera screen directly for the relevant match
- **Reaction recording** — 10–15 second video captured with `expo-camera`, uploaded to Supabase Storage
- **Live feed** — Reactions appear in real-time via Supabase Realtime (Postgres Changes + Broadcast)
- **Presence** — Who's watching or recording per match
- **Fanometro** — Sentiment score aggregated per team/match
- **Likes** — Reaction like tracking

---

## Database (key tables)

| Table | Purpose |
|---|---|
| `profiles` | User data + team affiliation |
| `teams` | World Cup teams + badges |
| `matches` | Live match state from API-Football |
| `live_events` | Goals, kickoff, halftime, fulltime (append-only) |
| `reactions` | User videos with metadata |
| `reaction_likes` | Like tracking |
| `push_tokens` | Device push tokens |
| `match_subscriptions` | User match + push preferences |
| `match_goal_state` | Worker idempotency tracker |

Storage bucket: `reactions` → path `<match_id>/<user_id>/<timestamp>.mp4`

---

## Getting Started

### Prerequisites

- Node.js 20+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- iOS Simulator / Android Emulator or physical device

### Mobile app

```bash
cd mobile
npm install
npx expo start
```

### Supabase (local)

```bash
supabase start
supabase db push
```

Set environment variables in `mobile/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## Sprint Plan

| Sprint | Dates | Goal |
|---|---|---|
| 1 | May 15–21 | Foundation — Auth, navigation, schema, notifications |
| 2 | May 22–28 | Goal Detection — Worker, push delivery |
| 3 | May 29–Jun 4 | Camera & Upload — Recording, preview, storage |
| 4 | Jun 5–10 | Realtime Polish — Presence, optimistic updates, observability |

MVP target: **June 11, 2026** (World Cup opening match).

---

## MVP Acceptance Criteria

1. Sign up and choose a team
2. See match list with live scores
3. Receive push notification when a goal is scored
4. App opens directly to the camera for that match
5. Record and upload a reaction video
6. Reaction appears in real-time feed with likes
7. Handles 50+ concurrent users per match
