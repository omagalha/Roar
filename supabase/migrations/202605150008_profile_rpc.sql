create or replace function public.upsert_own_profile(
  target_username text,
  target_team_id text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.profiles;
  clean_username text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  clean_username := lower(trim(target_username));

  if char_length(clean_username) < 3 or char_length(clean_username) > 30 then
    raise exception 'username must be between 3 and 30 characters';
  end if;

  if clean_username !~ '^[a-zA-Z0-9_]+$' then
    raise exception 'username can only contain letters, numbers and underscores';
  end if;

  if target_team_id is not null
    and not exists (select 1 from public.teams where id = target_team_id) then
    raise exception 'team does not exist';
  end if;

  insert into public.profiles (id, username, team_id)
  values (auth.uid(), clean_username, target_team_id)
  on conflict (id)
  do update set
    username = excluded.username,
    team_id = excluded.team_id
  returning * into row;

  return row;
end;
$$;

grant execute on function public.upsert_own_profile(text, text) to authenticated;
