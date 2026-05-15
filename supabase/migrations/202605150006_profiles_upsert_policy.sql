drop policy if exists "users upsert own profile" on public.profiles;

create policy "users upsert own profile"
on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);
