insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'reactions',
  'reactions',
  true,
  52428800,
  array['video/mp4', 'video/quicktime', 'video/mov']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.reactions
  add column if not exists storage_path text,
  add column if not exists mime_type text not null default 'video/mp4',
  add column if not exists upload_status text not null default 'ready',
  add column if not exists moderation_status text not null default 'visible',
  add column if not exists published_at timestamptz not null default now();

alter table public.reactions
  drop constraint if exists reactions_upload_status_check;

alter table public.reactions
  add constraint reactions_upload_status_check
  check (upload_status in ('uploading', 'ready', 'failed'));

alter table public.reactions
  drop constraint if exists reactions_moderation_status_check;

alter table public.reactions
  add constraint reactions_moderation_status_check
  check (moderation_status in ('visible', 'hidden', 'flagged'));

create index if not exists reactions_visible_feed_idx
  on public.reactions (match_id, published_at desc)
  where upload_status = 'ready' and moderation_status = 'visible';

create or replace function public.create_reaction(
  target_match_id text,
  target_event_id uuid,
  target_video_url text,
  target_thumbnail_url text,
  target_duration_ms integer,
  target_storage_path text default null,
  target_mime_type text default 'video/mp4'
)
returns public.reactions
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.reactions;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if target_storage_path is not null
    and split_part(target_storage_path, '/', 2) <> auth.uid()::text then
    raise exception 'invalid storage path for user';
  end if;

  insert into public.reactions (
    match_id,
    user_id,
    event_id,
    video_url,
    thumbnail_url,
    duration_ms,
    storage_path,
    mime_type,
    upload_status,
    moderation_status,
    published_at
  )
  values (
    target_match_id,
    auth.uid(),
    target_event_id,
    target_video_url,
    target_thumbnail_url,
    target_duration_ms,
    target_storage_path,
    coalesce(target_mime_type, 'video/mp4'),
    'ready',
    'visible',
    now()
  )
  returning * into row;

  insert into public.live_events (
    match_id,
    external_event_id,
    event_type,
    payload
  )
  values (
    target_match_id,
    'reaction:' || row.id,
    'reaction_created',
    jsonb_build_object(
      'reaction_id', row.id,
      'user_id', auth.uid(),
      'event_id', target_event_id,
      'video_url', target_video_url,
      'duration_ms', target_duration_ms
    )
  )
  on conflict (external_event_id) do nothing;

  return row;
end;
$$;

drop policy if exists "reaction videos are publicly readable" on storage.objects;
create policy "reaction videos are publicly readable"
on storage.objects for select
using (bucket_id = 'reactions');

drop policy if exists "users upload own reaction videos" on storage.objects;
create policy "users upload own reaction videos"
on storage.objects for insert
with check (
  bucket_id = 'reactions'
  and auth.uid() is not null
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "users update own reaction videos" on storage.objects;
create policy "users update own reaction videos"
on storage.objects for update
using (
  bucket_id = 'reactions'
  and auth.uid() is not null
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'reactions'
  and auth.uid() is not null
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "users delete own reaction videos" on storage.objects;
create policy "users delete own reaction videos"
on storage.objects for delete
using (
  bucket_id = 'reactions'
  and auth.uid() is not null
  and (storage.foldername(name))[2] = auth.uid()::text
);

create or replace view public.sprint3_reaction_upload_check as
select
  r.match_id,
  count(*) as reactions,
  count(*) filter (where r.upload_status = 'ready') as ready_reactions,
  count(*) filter (where r.storage_path is not null) as stored_reactions,
  max(r.published_at) as latest_published_at
from public.reactions r
group by r.match_id;
