# ROAR Architecture Plan

Data base: 15 de maio de 2026.
Janela alvo: Copa do Mundo FIFA 2026, de 11 de junho a 19 de julho de 2026.

## Objetivo

Construir o ROAR como um social app de reacoes ao vivo para futebol, com um MVP solido antes da abertura da Copa e capacidade de evoluir durante o torneio.

O produto nao precisa nascer como uma rede social completa. Ele precisa acertar uma coisa melhor que todo mundo: gol detectado em tempo real, push rapido, camera abre no momento certo, reacao gravada e feed vivo por partida.

## Decisao Arquitetural Principal

Stack recomendada para o MVP:

- App: React Native + Expo + TypeScript.
- Backend principal: Supabase Auth, Postgres, Storage metadata e Realtime.
- Midia: Cloudflare R2 para videos de reacao.
- Push: Expo Notifications.
- Worker de gol: Supabase Edge Function em Deno.
- Realtime de feed: Supabase Realtime com Postgres Changes, Broadcast e Presence por `match_id`.
- Camera MVP: `expo-camera`.
- Camera fase 2: `react-native-vision-camera`, se IA/frame processors virarem necessidade real.
- Video ao vivo/WebRTC: LiveKit apenas para salas ou janelas ao vivo especificas, nao para o feed inteiro no MVP.

## Repositorios Extraidos e Papel de Cada Um

### Feed e UI

- `kirkwat/tiktok`
  - Papel: esqueleto do feed vertical.
  - Aproveitar: FlatList vertical, `viewabilityConfig`, playback do item ativo, likes, upload.
  - Adaptar: Firebase Auth/Firestore/Storage para Supabase + R2.

- `ShehrozAttique/Social-Media-App`
  - Papel: polimento de gestos e animacoes.
  - Aproveitar: transicoes, gesture handler, conteudo misto.

- `ElSierra/Social-app-React-Native`
  - Papel: perfis, followers, discover.
  - Aproveitar depois do MVP, quando o ROAR virar rede e nao so experiencia de partida.

### Realtime e Video

- `livekit/client-sdk-react-native`
  - Papel: SDK oficial LiveKit para React Native.
  - Aproveitar: rooms, microfone/camera, sessao de audio iOS/Android.
  - Uso no MVP: opcional, restrito a uma sala do gol ou watch party.

- `livekit/livekit`
  - Papel: servidor SFU.
  - Decisao: usar LiveKit Cloud no MVP. Self-host so depois de validacao.

- `livekit-examples/meet`
  - Papel: referencia para criacao de room, token e webhook.

### Camera

- `mrousavy/react-native-vision-camera`
  - Papel: camera nativa de alta performance.
  - Decisao: guardar para fase 2 se o Expo Camera limitar performance.

- `udkhatri/socialApp`
  - Papel: fluxo simples de camera para preview e post.
  - Aproveitar: UX captura -> preview -> caption -> publicar.

### Social Core e Ranking

- `bluesky-social/social-app`
  - Papel: referencia arquitetural de social app React Native em producao.
  - Aproveitar: organizacao de pastas, sessoes, React Query, infinite scroll, onboarding, erros.
  - Regra: nao copiar a complexidade do Bluesky no MVP.

- `bluesky-social/feed-generator`
  - Papel: referencia para servico de ranking.
  - Aproveitar: modelo mental do Fanometro e Top Reactions.

### Backend e Push

- `supabase/realtime`
  - Papel: entender Broadcast, Presence e Postgres Changes.
  - Uso no ROAR: canal `match:{match_id}` para feed, eventos e usuarios online.

- `dch133/Social-Media-App`
  - Papel: referencia de backend social com triggers.
  - Adaptar: cloud functions para Supabase Edge Functions.

- `expo-notifications`
  - Papel: push cross-platform para iOS e Android.
  - Uso: registrar token, salvar no Supabase, abrir camera ao tocar no push de gol.

## Componentes do Sistema

### App Mobile

Modulos principais:

- `auth`: login, sessao, perfil minimo.
- `matches`: lista de jogos, placar, status, times.
- `match-room`: tela da partida, feed ao vivo, presence, CTA de camera.
- `camera-trigger`: captura rapida apos gol, timer, preview, upload.
- `feed`: feed vertical de reacoes, playback, like, comment basico.
- `notifications`: permissao, token Expo, deep link para partida/camera.

### Banco Supabase

Tabelas essenciais:

- `profiles`
  - `id`, `username`, `avatar_url`, `team_id`, `created_at`.

- `teams`
  - `id`, `name`, `country`, `badge_url`.

- `matches`
  - `id`, `external_fixture_id`, `home_team_id`, `away_team_id`, `starts_at`, `status`, `home_goals`, `away_goals`.

- `match_goal_state`
  - Estado idempotente do worker por fixture.

- `live_events`
  - Eventos append-only: goal, kickoff, halftime, fulltime, reaction_created.

- `reactions`
  - `id`, `match_id`, `user_id`, `event_id`, `video_url`, `thumbnail_url`, `duration_ms`, `score`, `created_at`.

- `reaction_likes`
  - Like por usuario e reacao.

- `match_subscriptions`
  - `match_id`, `user_id`, `expo_push_token`, `push_enabled`.

- `push_tokens`
  - Token por device, plataforma, usuario.

### Worker de Gol

Ja existe neste workspace em:

- `supabase/functions/goal-worker/index.ts`
- `supabase/migrations/202605150001_goal_worker.sql`

Fluxo:

1. Cron chama worker a cada 15 a 30 segundos em janela de jogos.
2. Worker consulta API-Football.
3. Compara placar atual com `match_goal_state`.
4. Insere evento idempotente em `live_events`.
5. Busca tokens inscritos em `match_subscriptions`.
6. Envia push em batch via Expo.
7. App abre na partida ou direto na camera.

### Realtime

Canais:

- `match:{match_id}:events`
  - Postgres Changes em `live_events`.

- `match:{match_id}:feed`
  - Postgres Changes em `reactions`.

- `match:{match_id}:presence`
  - Presence com usuarios online, time torcido e status de gravacao.

- `match:{match_id}:broadcast`
  - Eventos efemeros: "gol agora", "usuario gravando", "reacao publicada".

## Fluxos Criticos

### Gol para Camera

1. API-Football muda placar.
2. Worker detecta gol.
3. `live_events` recebe evento `goal`.
4. Supabase Realtime atualiza tela de quem esta no match room.
5. Expo Push acorda quem esta fora do app.
6. App abre camera com timer de 10 a 15 segundos.
7. Usuario grava reacao.
8. App faz upload para R2.
9. Insere `reactions`.
10. Feed recebe item novo via Realtime.

Meta tecnica: do gol detectado ate push recebido em menos de 3 segundos quando o provedor de dados permitir.

### Feed de Reacoes

1. Cliente busca pagina inicial de `reactions` por `match_id`.
2. React Query pagina dados historicos.
3. Supabase Realtime injeta reacoes novas no topo.
4. Feed vertical toca apenas o item visivel.
5. Likes e comentarios usam optimistic update.

### Fanometro

MVP:

- Score simples no banco:
  - likes
  - recencia
  - completude do video
  - reacao ao evento mais recente

Fase 2:

- Servico separado inspirado no `bluesky-social/feed-generator`.
- Ranking por partida, por time, por pais e geral.

## Roadmap Ate a Copa

### Sprint 1: Fundacao, 15 a 21 de maio

Entregavel: app abre, autentica, lista partidas fake/reais, entra em uma sala de jogo.

- Criar app Expo TypeScript.
- Configurar Supabase Auth.
- Criar schema base.
- Implementar navegacao: auth, tabs, match room, camera, feed.
- Integrar Expo Notifications e salvar token.
- Testar deep link de notificacao para `match_id`.

### Sprint 2: Gol Vivo, 22 a 28 de maio

Entregavel: worker detecta gol e celular recebe push.

- Conectar API-Football.
- Rodar migration do worker.
- Agendar Edge Function.
- Inserir `live_events`.
- Inscrever usuario em `match_subscriptions`.
- Push abre match room/camera.
- Medir latencia ponta a ponta.

### Sprint 3: Camera e Upload, 29 de maio a 4 de junho

Entregavel: usuario grava reacao de 10 a 15 segundos e aparece no feed.

- Implementar `expo-camera`.
- Timer de gravacao.
- Preview antes de postar.
- Upload para R2 ou storage temporario.
- Inserir `reactions`.
- Feed vertical com playback.
- Tratamento de permissao de camera, microfone e notificacao.

### Sprint 4: Realtime e Polimento, 5 a 10 de junho

Entregavel: MVP pronto para abertura em 11 de junho.

- Presence por partida.
- Reacoes novas aparecem sem refresh.
- Likes com optimistic update.
- Fallback se push falhar.
- Observabilidade minima: logs do worker, contagem de pushes, erros de upload.
- Teste com 20 a 50 usuarios em uma partida simulada.

### Copa: Operacao e Evolucao, 11 de junho a 19 de julho

Fase de grupos:

- Corrigir gargalos reais.
- Melhorar onboarding.
- Ajustar permissao de push.
- Criar pagina/share link por partida.

Mata-mata:

- Fanometro v1.
- Top Reactions.
- Ranking por torcida.
- Moderacao basica.

Final:

- Preparar campanha e replay/melhores momentos.

## O que Fica Fora do MVP

- Rede social completa com DM.
- LiveKit self-host.
- Vision Camera com IA.
- Algoritmo complexo de recomendacao.
- Comentarios em arvore.
- Moderacao avancada com ML.
- Multi-feed global sofisticado.

Essas partes sao boas, mas nao sao o coracao ate 11 de junho.

## Riscos e Mitigacoes

- Latencia da API esportiva:
  - Mitigar com polling agressivo apenas em partidas ativas e logs de tempo por etapa.

- Push nao chega em todos os devices:
  - Mitigar com Realtime dentro do app, retry parcial e dashboard de tickets Expo.

- Permissoes reduzem conversao:
  - Pedir push quando usuario seguir uma partida, nao no primeiro boot.
  - Pedir camera apenas no primeiro momento de captura.

- Upload lento:
  - Limitar duracao e qualidade.
  - Subir em background apos preview.
  - Publicar item com estado `processing`.

- Escala do feed:
  - Paginar por `match_id`.
  - Indexar `created_at`.
  - Evitar queries globais no MVP.

## Definicao de Pronto do MVP

O ROAR esta pronto para a abertura quando:

- Um usuario consegue criar conta.
- Um usuario consegue escolher uma partida.
- O app registra push token.
- O worker detecta ou simula gol.
- O push chega e abre a partida/camera.
- O usuario grava uma reacao curta.
- A reacao aparece no feed de outros usuarios em tempo real.
- O sistema sobrevive a uma simulacao de pelo menos 50 usuarios na mesma partida.

## Norte de Produto

O ROAR nao e so um TikTok de futebol. E uma maquina de capturar emocao sincronizada com o acontecimento real.

Tudo que nao aumenta a chance de capturar, publicar e distribuir a reacao ao gol deve esperar.
