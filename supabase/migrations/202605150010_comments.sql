alter table public.posts
  alter column image_url drop not null;

alter table public.posts
  add column if not exists comments_count integer;

alter table public.posts
  alter column comments_count set default 0;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  constraint comments_content_length check (char_length(content) <= 500)
);

create index if not exists comments_post_id_created_at_idx
  on public.comments (post_id, created_at asc);

create index if not exists comments_user_id_created_at_idx
  on public.comments (user_id, created_at desc);

create or replace function public.update_post_comments_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts
    set comments_count = comments_count + 1
    where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.posts
    set comments_count = greatest(comments_count - 1, 0)
    where id = old.post_id;
  end if;

  return null;
end;
$$;

drop trigger if exists comments_increment_post_comments_count on public.comments;
drop trigger if exists comments_decrement_post_comments_count on public.comments;
drop trigger if exists trg_post_comments_count on public.comments;
create trigger trg_post_comments_count
after insert or delete on public.comments
for each row execute function public.update_post_comments_count();

update public.posts
set comments_count = (
  select count(*)::integer
  from public.comments
  where comments.post_id = posts.id
);

alter table public.posts
  alter column comments_count set not null;

create or replace function public.create_post(
  target_image_url text default null,
  target_caption text default null,
  target_match_id text default null,
  target_storage_path text default null
)
returns public.posts
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.posts;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'profile does not exist';
  end if;

  if target_match_id is not null
    and not exists (select 1 from public.matches where id = target_match_id) then
    raise exception 'match does not exist';
  end if;

  if target_storage_path is not null
    and split_part(target_storage_path, '/', 2) <> auth.uid()::text then
    raise exception 'invalid storage path for user';
  end if;

  insert into public.posts (
    user_id,
    match_id,
    caption,
    image_url,
    storage_path
  )
  values (
    auth.uid(),
    target_match_id,
    nullif(trim(target_caption), ''),
    nullif(trim(target_image_url), ''),
    target_storage_path
  )
  returning * into row;

  return row;
end;
$$;

grant execute on function public.create_post(text, text, text, text) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.comments;
  end if;
exception
  when duplicate_object then null;
end;
$$;

alter table public.comments replica identity full;
alter table public.comments enable row level security;

drop policy if exists "comments are readable" on public.comments;
drop policy if exists "comments visíveis a todos" on public.comments;
create policy "comments visíveis a todos" on public.comments
for select using (true);

drop policy if exists "users insert own comments" on public.comments;
drop policy if exists "usuário cria próprio comentário" on public.comments;
create policy "usuário cria próprio comentário" on public.comments
for insert with check (auth.uid() = user_id);

drop policy if exists "users delete own comments" on public.comments;
drop policy if exists "usuário deleta próprio comentário" on public.comments;
create policy "usuário deleta próprio comentário" on public.comments
for delete using (auth.uid() = user_id);
