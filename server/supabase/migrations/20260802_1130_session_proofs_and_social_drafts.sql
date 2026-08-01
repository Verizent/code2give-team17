-- Session photo proofs + caption drafts for the staff Story desk.
-- Approvals and copy-status survive restarts. Meta Graph publish is out of
-- scope — staff copy captions into Instagram/Facebook themselves.
--
-- NOT APPLIED by default. Run in the Supabase SQL editor after announcing it
-- (content migrations share that rule — §28). Until applied, Story desk returns
-- available: false and an empty queue rather than an in-memory fake.

create table if not exists public.session_proofs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  programme text not null default 'community',
  captured_at timestamptz not null default now(),
  consent text not null default 'none'
    check (consent in ('consented', 'partial', 'none')),
  members_visible integer not null default 0 check (members_visible >= 0),
  members_blurred integer not null default 0 check (members_blurred >= 0),
  thumb_url text not null default '/brand/hero-group.jpg',
  status text not null default 'pending'
    check (status in ('pending', 'approved')),
  approved_at timestamptz,
  fanout jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists session_proofs_status_idx
  on public.session_proofs (status, captured_at desc);

drop trigger if exists session_proofs_set_updated_at on public.session_proofs;
create trigger session_proofs_set_updated_at
  before update on public.session_proofs
  for each row execute function public.set_updated_at();

alter table public.session_proofs enable row level security;

-- RLS blocks anon; service_role still needs explicit DML grants (PostgREST).
grant select, insert, update, delete on table public.session_proofs to service_role;

create table if not exists public.social_drafts (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('instagram', 'facebook')),
  lang text not null check (lang in ('en', 'zh-Hant', 'zh-Hans')),
  caption text not null,
  status text not null default 'draft'
    check (status in ('draft', 'queued', 'copied')),
  scheduled_for timestamptz,
  proof_id uuid references public.session_proofs (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_drafts_created_idx
  on public.social_drafts (created_at desc);
create index if not exists social_drafts_proof_idx
  on public.social_drafts (proof_id);

drop trigger if exists social_drafts_set_updated_at on public.social_drafts;
create trigger social_drafts_set_updated_at
  before update on public.social_drafts
  for each row execute function public.set_updated_at();

alter table public.social_drafts enable row level security;

grant select, insert, update, delete on table public.social_drafts to service_role;

-- Seed three pending session photos so the Story desk has real rows once applied.
-- Fixed UUIDs keep re-runs idempotent with on conflict do nothing.
insert into public.session_proofs (
  id, title, programme, captured_at, consent,
  members_visible, members_blurred, thumb_url, status
) values
  (
    'a1000000-0000-4000-8000-000000000001',
    'Saturday bocce — San Po Kong',
    'sports',
    '2026-07-26T04:00:00.000Z',
    'partial',
    4, 2,
    '/brand/hero-group.jpg',
    'pending'
  ),
  (
    'a1000000-0000-4000-8000-000000000002',
    'K-pop class assistants',
    'community_education',
    '2026-07-28T08:30:00.000Z',
    'consented',
    6, 0,
    '/brand/hero-group.jpg',
    'pending'
  ),
  (
    'a1000000-0000-4000-8000-000000000003',
    'Nutrition workshop — family morning',
    'nutrition',
    '2026-07-20T02:15:00.000Z',
    'none',
    0, 5,
    '/brand/hero-group.jpg',
    'pending'
  )
on conflict (id) do nothing;
