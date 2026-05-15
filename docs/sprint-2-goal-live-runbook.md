# Sprint 2 Runbook: Gol Vivo

Objetivo: provar o ciclo `gol -> live_events -> Realtime -> push -> camera/feed`.

## 1. Aplicar Backend

```sh
supabase db push
supabase functions deploy goal-worker
supabase functions deploy simulate-goal
```

As duas functions estao com `verify_jwt = false` em `supabase/config.toml` porque usam `WORKER_CRON_SECRET` como bearer proprio.

Secrets:

```sh
supabase secrets set SUPABASE_URL=...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set API_FOOTBALL_KEY=...
supabase secrets set WORKER_CRON_SECRET=...
```

O `API_FOOTBALL_KEY` e usado pelo `goal-worker`. O `simulate-goal` nao precisa dele.

## 2. Testar Sem Jogo Real

A migration de Sprint 2 cria a partida:

- `sprint2-br-ar`: Brasil x Argentina, status `LIVE`.

Depois de abrir o app e se inscrever na partida, simule um gol:

```sh
curl -X POST "$SUPABASE_URL/functions/v1/simulate-goal" \
  -H "Authorization: Bearer $WORKER_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"match_id":"sprint2-br-ar","side":"home","minute":36}'
```

Resposta esperada:

```json
{
  "event": {
    "match_id": "sprint2-br-ar",
    "event_type": "goal"
  },
  "pushes": 1
}
```

`pushes` pode ser `0` se ainda nao houver inscricao em `match_subscriptions`.

## 3. Validar no Banco

```sql
select * from public.sprint2_goal_live_check;

select *
from public.live_events
where match_id = 'sprint2-br-ar'
order by created_at desc;
```

Checklist:

- `home_goals` ou `away_goals` aumentou.
- `goal_events` aumentou.
- O app recebeu o evento via Realtime.
- Quem esta inscrito em `match_subscriptions` recebeu push.

## 4. Testar com API-Football

Chame o worker manualmente:

```sh
curl -X POST "$SUPABASE_URL/functions/v1/goal-worker" \
  -H "Authorization: Bearer $WORKER_CRON_SECRET"
```

Resposta esperada:

```json
{
  "checked": 1,
  "goals": 0,
  "pushes": 0
}
```

Em dias sem jogos ao vivo, `checked` pode ser `0`.

## 5. Agendamento

Durante janela de jogo:

- Rodar `goal-worker` a cada 15 a 30 segundos.

Fora de janela de jogo:

- Rodar a cada 60 segundos ou desligar para economizar chamadas.

## 6. Contrato Para o Frontend

O app deve:

- Chamar `upsert_push_token` apos permissao de notificacao.
- Chamar `subscribe_to_match` quando usuario seguir/abrir push da partida.
- Assinar `live_events` filtrado por `match_id`.
- Ao receber `event_type = 'goal'`, mostrar flash de gol e CTA de camera.
- Ao tocar no push, abrir `/camera/[matchId]` com `event_id`.

## 7. Definition of Done

Sprint 2 esta pronta quando:

- `simulate-goal` cria evento e atualiza placar.
- `goal-worker` chama API-Football sem erro de auth.
- `match_subscriptions` recebe token real do celular.
- Push chega em device fisico.
- Evento aparece no app em tempo real sem refresh.
