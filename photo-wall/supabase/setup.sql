-- Photo Wall: one-time Supabase setup.
--
-- Paste this whole file into your Supabase project's SQL Editor and run it.
-- BEFORE running, change the email on the last line to the email of the
-- account you'll sign in with to approve photos. It's safe to run again.
--
-- Who can do what (enforced by the database, not just the app):
--   anyone with the link   send photos (they land as 'pending'), see approved ones
--   wall admins            see pending photos, approve, reject, remove, change settings

-- ---------- who may approve ----------
create table if not exists public.wall_admins (
  email text primary key
);
alter table public.wall_admins enable row level security;
-- No policies on purpose: nobody can read or change this table through the API.

create or replace function public.is_wall_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.wall_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------- photos ----------
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  path text not null check (char_length(path) <= 200),
  caption text not null default '' check (char_length(caption) <= 100),
  credit text not null default '' check (char_length(credit) <= 40),
  status text not null default 'pending' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);
alter table public.photos enable row level security;

drop policy if exists "anyone sends pending photos" on public.photos;
create policy "anyone sends pending photos" on public.photos
  for insert to anon, authenticated
  with check (status = 'pending' and approved_at is null and path like 'uploads/%');

drop policy if exists "anyone sees approved photos" on public.photos;
create policy "anyone sees approved photos" on public.photos
  for select to anon, authenticated
  using (status = 'approved' or public.is_wall_admin());

drop policy if exists "admins update photos" on public.photos;
create policy "admins update photos" on public.photos
  for update to authenticated
  using (public.is_wall_admin()) with check (public.is_wall_admin());

drop policy if exists "admins delete photos" on public.photos;
create policy "admins delete photos" on public.photos
  for delete to authenticated
  using (public.is_wall_admin());

-- ---------- display settings (a single row) ----------
create table if not exists public.wall_settings (
  id int primary key default 1 check (id = 1),
  seconds int not null default 5 check (seconds between 2 and 60),
  captions boolean not null default true,
  spotlight boolean not null default true,
  show_qr boolean not null default true
);
insert into public.wall_settings (id) values (1) on conflict (id) do nothing;
alter table public.wall_settings enable row level security;

drop policy if exists "anyone reads settings" on public.wall_settings;
create policy "anyone reads settings" on public.wall_settings
  for select to anon, authenticated using (true);

drop policy if exists "admins change settings" on public.wall_settings;
create policy "admins change settings" on public.wall_settings
  for update to authenticated
  using (public.is_wall_admin()) with check (public.is_wall_admin());

-- ---------- live updates ----------
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'photos') then
    alter publication supabase_realtime add table public.photos;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'wall_settings') then
    alter publication supabase_realtime add table public.wall_settings;
  end if;
end $$;

-- ---------- photo storage ----------
-- Public bucket: an approved photo's file URL works for anyone, including vMix.
-- Files are named with random ids, so pending photos can't be guessed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "anyone uploads photos" on storage.objects;
create policy "anyone uploads photos" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'photos' and name like 'uploads/%');

drop policy if exists "admins delete photo files" on storage.objects;
create policy "admins delete photo files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and public.is_wall_admin());

-- ---------- YOUR EMAIL: change this before running ----------
insert into public.wall_admins (email) values ('you@example.com') on conflict do nothing;
