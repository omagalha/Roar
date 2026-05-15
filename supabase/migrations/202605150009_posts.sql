create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id text references public.matches(id) on delete set null,
  caption text,
  image_url text not null,
  storage_path text,
  score integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx
  on public.posts (created_at desc);

create index if not exists posts_match_id_created_at_idx
  on public.posts (match_id, created_at desc)
  where match_id is not null;

create index if not exists posts_user_id_created_at_idx
  on public.posts (user_id, created_at desc);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_user_id_idx
  on public.post_likes (user_id);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'posts',
  'posts',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.increment_post_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts
  set score = score + 1
  where id = new.post_id;

  return new;
end;
$$;

create or replace function public.decrement_post_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts
  set score = greatest(score - 1, 0)
  where id = old.post_id;

  return old;
end;
$$;

drop trigger if exists post_likes_increment_score on public.post_likes;
create trigger post_likes_increment_score
after insert on public.post_likes
for each row execute function public.increment_post_score();

drop trigger if exists post_likes_decrement_score on public.post_likes;
create trigger post_likes_decrement_score
after delete on public.post_likes
for each row execute function public.decrement_post_score();

create or replace function public.create_post(
  target_image_url text,
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
    target_image_url,
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
    alter publication supabase_realtime add table public.posts;
    alter publication supabase_realtime add table public.post_likes;
  end if;
exception
  when duplicate_object then null;
end;
$$;

alter table public.posts enable row level security;
alter table public.post_likes enable row level security;

drop policy if exists "posts are readable" on public.posts;
create policy "posts are readable" on public.posts
for select using (true);

drop policy if exists "users insert own posts" on public.posts;
create policy "users insert own posts" on public.posts
for insert with check (auth.uid() = user_id);

drop policy if exists "users update own posts" on public.posts;
create policy "users update own posts" on public.posts
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users delete own posts" on public.posts;
create policy "users delete own posts" on public.posts
for delete using (auth.uid() = user_id);

drop policy if exists "post likes are readable" on public.post_likes;
create policy "post likes are readable" on public.post_likes
for select using (true);

drop policy if exists "users insert own post likes" on public.post_likes;
create policy "users insert own post likes" on public.post_likes
for insert with check (auth.uid() = user_id);

drop policy if exists "users delete own post likes" on public.post_likes;
create policy "users delete own post likes" on public.post_likes
for delete using (auth.uid() = user_id);

drop policy if exists "post images are publicly readable" on storage.objects;
create policy "post images are publicly readable"
on storage.objects for select
using (bucket_id = 'posts');

drop policy if exists "users upload own post images" on storage.objects;
create policy "users upload own post images"
on storage.objects for insert
with check (
  bucket_id = 'posts'
  and auth.uid() is not null
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "users update own post images" on storage.objects;
create policy "users update own post images"
on storage.objects for update
using (
  bucket_id = 'posts'
  and auth.uid() is not null
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'posts'
  and auth.uid() is not null
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "users delete own post images" on storage.objects;
create policy "users delete own post images"
on storage.objects for delete
using (
  bucket_id = 'posts'
  and auth.uid() is not null
  and (storage.foldername(name))[2] = auth.uid()::text
);
