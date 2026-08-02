create table if not exists public.instagram_embeds (
  id            uuid primary key default gen_random_uuid(),
  url           text not null,
  caption_en    text,
  caption_zh    text,
  display_order integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists instagram_embeds_active_order_idx
  on public.instagram_embeds (is_active, display_order);

create trigger set_instagram_embeds_updated_at
  before update on public.instagram_embeds
  for each row execute function public.set_updated_at();

alter table public.instagram_embeds enable row level security;
