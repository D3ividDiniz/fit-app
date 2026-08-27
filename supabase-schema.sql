-- Dabliu.fit: run this once in Supabase Dashboard > SQL Editor.
-- This script contains no secret keys and no service-role access.

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  goal text not null default '',
  training_days integer not null default 0 check (training_days between 0 and 7),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  schema_version integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
alter table public.user_app_state enable row level security;

drop policy if exists "Users read their own profile" on public.user_profiles;
drop policy if exists "Users create their own profile" on public.user_profiles;
drop policy if exists "Users update their own profile" on public.user_profiles;
drop policy if exists "Users delete their own profile" on public.user_profiles;
drop policy if exists "Users read their own app state" on public.user_app_state;
drop policy if exists "Users create their own app state" on public.user_app_state;
drop policy if exists "Users update their own app state" on public.user_app_state;
drop policy if exists "Users delete their own app state" on public.user_app_state;

revoke all on table public.user_profiles from anon;
revoke all on table public.user_app_state from anon;
grant select, insert, update, delete on table public.user_profiles to authenticated;
grant select, insert, update, delete on table public.user_app_state to authenticated;

create policy "Users read their own profile"
  on public.user_profiles for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users create their own profile"
  on public.user_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update their own profile"
  on public.user_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete their own profile"
  on public.user_profiles for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read their own app state"
  on public.user_app_state for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users create their own app state"
  on public.user_app_state for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update their own app state"
  on public.user_app_state for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete their own app state"
  on public.user_app_state for delete to authenticated
  using ((select auth.uid()) = user_id);
