-- Profiles: identity row (extends auth.users) + volunteer prefs that currently
-- live in the browser (`love21-volunteer-prefs` localStorage).
--
-- Additive only — no DROP of tables, columns, or data.
-- Supabase may still warn if you paste a version with DROP TRIGGER/POLICY;
-- this file avoids those keywords so the editor warning stays quiet.
--
-- Naming note: `role` is the *account* role (`volunteer` | `admin`).
-- Class roles (assistant · host · event · other) live in `volunteer_roles`.

-- ---------------------------------------------------------------------------
-- Base table (safe if another track already created a thinner profiles)
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'volunteer'
    check (role in ('volunteer', 'admin')),
  email text,
  full_name text,
  phone text,
  locale text
    check (locale is null or locale in ('en', 'zh-Hant')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Extends auth.users. Account role + shared contact fields + volunteer prefs.';
comment on column public.profiles.role is
  'Account role (volunteer | admin). Never settable through public signup.';

alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists locale text;
alter table public.profiles add column if not exists created_at timestamptz;
alter table public.profiles add column if not exists updated_at timestamptz;

update public.profiles set role = 'volunteer' where role is null;
update public.profiles set created_at = coalesce(created_at, now()) where created_at is null;
update public.profiles set updated_at = coalesce(updated_at, now()) where updated_at is null;

alter table public.profiles alter column role set default 'volunteer';
alter table public.profiles alter column created_at set default now();
alter table public.profiles alter column updated_at set default now();

-- Only tighten NOT NULL once nulls are gone
do $$
begin
  alter table public.profiles alter column role set not null;
exception
  when others then null;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('volunteer', 'admin'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_locale_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_locale_check
      check (locale is null or locale in ('en', 'zh-Hant'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Volunteer prefs (were client-only)
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists chinese_name text;
alter table public.profiles add column if not exists age_group text;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists volunteer_roles text[] not null default '{}';
alter table public.profiles add column if not exists volunteer_role_other text;
alter table public.profiles add column if not exists skills text[] not null default '{}';
alter table public.profiles add column if not exists about text;
alter table public.profiles add column if not exists discovery text;
alter table public.profiles add column if not exists discovery_other text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_age_group_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_age_group_check
      check (
        age_group is null or age_group in (
          'youth14_18', 'age19_29', 'age30_44', 'age45_59', 'age60_plus'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_gender_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_gender_check
      check (
        gender is null or gender in ('female', 'male', 'prefer_not')
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_discovery_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_discovery_check
      check (
        discovery is null or discovery in (
          'existing', 'social', 'edm', 'company', 'other'
        )
      );
  end if;
end $$;

comment on column public.profiles.chinese_name is
  'Volunteer form Chinese name.';
comment on column public.profiles.age_group is
  'Volunteer demographic bracket from signup.';
comment on column public.profiles.gender is
  'Volunteer form gender (optional prefer_not).';
comment on column public.profiles.volunteer_roles is
  'Class roles: assistant | host | event | other. Distinct from profiles.role.';
comment on column public.profiles.volunteer_role_other is
  'Free text when volunteer_roles includes other.';
comment on column public.profiles.skills is
  'Volunteer skill chips (patient, sports, music, …).';
comment on column public.profiles.about is
  'Optional short bio from volunteer signup.';
comment on column public.profiles.discovery is
  'How the volunteer found Love 21 (form enum, not signup discovery_source).';
comment on column public.profiles.discovery_other is
  'Free text when discovery = other.';

-- ---------------------------------------------------------------------------
-- Triggers / functions — create only when missing (no DROP)
-- ---------------------------------------------------------------------------

-- Prefer existing hardened set_updated_at from other migrations; only add if absent.
do $$
begin
  if to_regprocedure('public.set_updated_at()') is null then
    execute $fn$
      create function public.set_updated_at()
      returns trigger
      language plpgsql
      set search_path = ''
      as $body$
      begin
        new.updated_at = now();
        return new;
      end;
      $body$
    $fn$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at'
      and tgrelid = 'public.profiles'::regclass
  ) then
    create trigger set_updated_at
      before update on public.profiles
      for each row execute function public.set_updated_at();
  end if;
end $$;

do $$
begin
  if to_regprocedure('public.handle_new_user()') is null then
    execute $fn$
      create function public.handle_new_user()
      returns trigger
      language plpgsql
      security definer
      set search_path = ''
      as $body$
      begin
        insert into public.profiles (id, email, full_name, role)
        values (
          new.id,
          new.email,
          coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
          'volunteer'
        )
        on conflict (id) do update
          set email = excluded.email,
              full_name = coalesce(public.profiles.full_name, excluded.full_name);
        return new;
      end;
      $body$
    $fn$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created'
      and tgrelid = 'auth.users'::regclass
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end $$;

-- Backfill any auth users missing a profile row (insert only)
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  coalesce(nullif(u.raw_app_meta_data ->> 'role', ''), 'volunteer')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- Align with existing Auth app_metadata admins (never demotes)
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and u.raw_app_meta_data ->> 'role' = 'admin'
  and p.role is distinct from 'admin';

-- ---------------------------------------------------------------------------
-- Privileges + RLS policies (create if missing — no DROP POLICY)
-- ---------------------------------------------------------------------------

grant select, insert, update on table public.profiles to service_role;

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_select_own'
  ) then
    create policy profiles_select_own
      on public.profiles
      for select
      to authenticated
      using (id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_update_own'
  ) then
    create policy profiles_update_own
      on public.profiles
      for update
      to authenticated
      using (id = auth.uid())
      with check (
        id = auth.uid()
        and role = (select p.role from public.profiles p where p.id = auth.uid())
      );
  end if;
end $$;

-- Optional after apply:
-- update public.profiles set role = 'admin' where email = 'you@example.com';
