# Sprint 3 Runbook: Camera e Upload

Objetivo: provar o ciclo `camera -> upload -> create_reaction -> feed realtime`.

## 1. Aplicar Backend

```sh
supabase db push
```

A migration `202605150004_sprint3_reaction_upload.sql` cria/configura:

- bucket publico `reactions`;
- policies de storage por path;
- metadados em `public.reactions`;
- RPC `create_reaction` com `storage_path`;
- view `sprint3_reaction_upload_check`.

## 2. Contrato de Storage

Bucket:

```txt
reactions
```

Path:

```txt
<match_id>/<user_id>/<timestamp>.mp4
```

Exemplo:

```txt
sprint2-br-ar/00000000-0000-0000-0000-000000000000/1715730000000.mp4
```

O app ja segue esse padrao em `mobile/src/hooks/useUpload.ts`.

## 3. Fluxo Esperado do App

1. Usuario abre `/camera/[matchId]`.
2. Grava ate 10 segundos.
3. App faz upload para o bucket `reactions`.
4. App pega `publicUrl`.
5. App chama `create_reaction`.
6. RPC insere `reactions`.
7. RPC insere `live_events` com `event_type = 'reaction_created'`.
8. Feed recebe a nova reaction pelo canal `match:${matchId}:feed`.

## 4. Validacao no Banco

```sql
select * from public.sprint3_reaction_upload_check;

select
  id,
  match_id,
  user_id,
  storage_path,
  upload_status,
  moderation_status,
  duration_ms,
  created_at
from public.reactions
order by created_at desc
limit 20;

select *
from public.live_events
where event_type = 'reaction_created'
order by created_at desc
limit 20;
```

Checklist:

- `storage_path` esta preenchido.
- `upload_status = 'ready'`.
- `moderation_status = 'visible'`.
- Existe `live_events.event_type = 'reaction_created'`.
- O feed mostra o video sem refresh.

## 5. Limites do MVP

- Duracao aceita: 1 a 20 segundos.
- Bucket publico para leitura rapida no feed.
- Sem thumbnail obrigatoria.
- Sem transcode no backend.
- Sem moderacao automatica por enquanto.

## 6. Proximo Endurecimento

Depois do MVP funcionar em device fisico:

- gerar thumbnail;
- validar tamanho/duracao real no servidor;
- mover para bucket privado com signed URLs se necessario;
- adicionar fila de moderacao;
- salvar dimensoes e codec;
- comprimir video antes do upload.

## 7. Definition of Done

Sprint 3 esta pronta quando:

- camera grava em device fisico;
- upload para `reactions` funciona com usuario autenticado;
- `create_reaction` retorna id;
- feed recebe a reaction em realtime;
- outro celular na mesma partida ve o video aparecer;
- like incrementa `score`.
