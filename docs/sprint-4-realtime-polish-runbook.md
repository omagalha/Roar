# Sprint 4 Runbook: Realtime e Polimento

Objetivo: deixar o MVP testavel para abertura, com Realtime confiavel, Presence visivel e health check operacional.

## 1. Aplicar Backend

```sh
supabase db push
supabase functions deploy goal-worker
supabase functions deploy simulate-goal
supabase functions deploy mvp-health
```

`supabase/config.toml` ja define `verify_jwt = false` para as functions que usam `WORKER_CRON_SECRET`.

## 2. Health Check

```sh
curl "$SUPABASE_URL/functions/v1/mvp-health" \
  -H "Authorization: Bearer $WORKER_CRON_SECRET"
```

Resposta esperada:

```json
{
  "ok": true,
  "launch": {
    "live_matches": 1,
    "events_last_hour": 1,
    "goals_last_hour": 1,
    "reactions_last_hour": 1,
    "active_push_subscriptions": 1,
    "latest_worker_status": "ok"
  },
  "rooms": []
}
```

## 3. Presence

Canal:

```txt
match:<match_id>:presence
```

Payload:

```ts
{
  user_id: string
  team_id: string | null
  mode: 'watching' | 'recording' | 'posting'
}
```

O app mostra:

- usuarios online;
- quantidade gravando agora.

## 4. Teste de Realtime

1. Abra a mesma partida em dois aparelhos ou duas sessoes.
2. Chame `simulate-goal`.
3. Ambos devem ver `GoalFlash`.
4. Um aparelho grava reaction.
5. O outro deve ver a reaction no feed sem refresh.
6. Like deve incrementar `score`.

## 5. Teste de Carga Manual

Meta Sprint 4:

- 20 a 50 sessoes na mesma partida.
- 5 a 10 reactions publicadas em sequencia.
- 3 simulacoes de gol.
- Nenhuma tela travada.
- `mvp-health.ok = true`.

SQL util:

```sql
select * from public.mvp_launch_check;

select *
from public.match_room_health
where match_id = 'sprint2-br-ar';

select *
from public.worker_runs
order by created_at desc
limit 20;
```

## 6. Sinais de Pronto

Sprint 4 esta pronta quando:

- `goal-worker` e `simulate-goal` gravam `worker_runs`;
- `mvp-health` responde;
- Presence mostra online/gravando;
- gol atualiza sala em realtime;
- reaction atualiza feed em realtime;
- push continua chegando em device fisico;
- TypeScript do mobile passa.
