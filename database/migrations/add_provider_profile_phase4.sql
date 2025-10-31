-- Adds rich provider profile and loyalty tables for phase 4 enhancements.
-- Safe to run multiple times thanks to IF NOT EXISTS guards.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

alter table public.providers
  add column if not exists tagline text,
  add column if not exists mission text,
  add column if not exists hero_image_url text,
  add column if not exists cover_video_url text,
  add column if not exists specialties text[],
  add column if not exists loyalty_enabled boolean not null default true;

alter table public.reviews
  add column if not exists is_verified boolean not null default false,
  add column if not exists tags text[],
  add column if not exists highlight text;

create table if not exists public.provider_media (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  media_type text not null default 'image',
  url text not null,
  thumbnail_url text,
  caption text,
  tags text[],
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists provider_media_provider_idx on public.provider_media(provider_id);
create index if not exists provider_media_featured_idx on public.provider_media(provider_id, is_featured, sort_order);

create table if not exists public.provider_team_members (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  full_name text not null,
  role text,
  bio text,
  avatar_url text,
  expertise text[],
  spotlight text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists provider_team_members_provider_idx on public.provider_team_members(provider_id, is_active, sort_order);

create table if not exists public.provider_highlights (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  title text not null,
  description text,
  icon text,
  badge text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists provider_highlights_provider_idx on public.provider_highlights(provider_id, is_active, sort_order);

create table if not exists public.provider_loyalty_balances (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  points_balance integer not null default 0,
  tier text not null default 'Bronce',
  total_earned integer not null default 0,
  total_redeemed integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(provider_id, client_id)
);

create index if not exists provider_loyalty_balances_provider_idx on public.provider_loyalty_balances(provider_id);
create index if not exists provider_loyalty_balances_client_idx on public.provider_loyalty_balances(client_id);

create table if not exists public.provider_loyalty_activity (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  points_change integer not null,
  reason text,
  source text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists provider_loyalty_activity_provider_idx on public.provider_loyalty_activity(provider_id, client_id, created_at desc);

create table if not exists public.discovery_sections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  layout text not null default 'carousel',
  feature_flag text,
  is_active boolean not null default true,
  priority integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discovery_section_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.discovery_sections(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete cascade,
  service_id uuid references public.services(id) on delete cascade,
  headline text,
  subheadline text,
  badge text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists discovery_section_items_section_idx on public.discovery_section_items(section_id, is_active, sort_order);

create or replace function public.bump_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists discovery_sections_set_updated_at on public.discovery_sections;
create trigger discovery_sections_set_updated_at
before update on public.discovery_sections
for each row execute function public.bump_updated_at();

alter table public.provider_media enable row level security;
alter table public.provider_team_members enable row level security;
alter table public.provider_highlights enable row level security;
alter table public.provider_loyalty_balances enable row level security;
alter table public.provider_loyalty_activity enable row level security;
alter table public.discovery_sections enable row level security;
alter table public.discovery_section_items enable row level security;

drop policy if exists "Public can view provider media" on public.provider_media;
create policy "Public can view provider media"
  on public.provider_media
  for select
  using (true);

drop policy if exists "Providers manage their media" on public.provider_media;
create policy "Providers manage their media"
  on public.provider_media
  for all
  using (provider_id in (select id from public.providers where user_id = auth.uid()))
  with check (provider_id in (select id from public.providers where user_id = auth.uid()));

drop policy if exists "Public can view provider team" on public.provider_team_members;
create policy "Public can view provider team"
  on public.provider_team_members
  for select
  using (is_active);

drop policy if exists "Providers manage their team" on public.provider_team_members;
create policy "Providers manage their team"
  on public.provider_team_members
  for all
  using (provider_id in (select id from public.providers where user_id = auth.uid()))
  with check (provider_id in (select id from public.providers where user_id = auth.uid()));

drop policy if exists "Public can view provider highlights" on public.provider_highlights;
create policy "Public can view provider highlights"
  on public.provider_highlights
  for select
  using (is_active);

drop policy if exists "Providers manage highlights" on public.provider_highlights;
create policy "Providers manage highlights"
  on public.provider_highlights
  for all
  using (provider_id in (select id from public.providers where user_id = auth.uid()))
  with check (provider_id in (select id from public.providers where user_id = auth.uid()));

drop policy if exists "Clients view their loyalty balance" on public.provider_loyalty_balances;
create policy "Clients view their loyalty balance"
  on public.provider_loyalty_balances
  for select
  using (client_id = auth.uid());

drop policy if exists "Providers manage loyalty balances" on public.provider_loyalty_balances;
create policy "Providers manage loyalty balances"
  on public.provider_loyalty_balances
  for all
  using (provider_id in (select id from public.providers where user_id = auth.uid()))
  with check (provider_id in (select id from public.providers where user_id = auth.uid()));

drop policy if exists "Clients view their loyalty history" on public.provider_loyalty_activity;
create policy "Clients view their loyalty history"
  on public.provider_loyalty_activity
  for select
  using (client_id = auth.uid());

drop policy if exists "Providers manage loyalty history" on public.provider_loyalty_activity;
create policy "Providers manage loyalty history"
  on public.provider_loyalty_activity
  for all
  using (provider_id in (select id from public.providers where user_id = auth.uid()))
  with check (provider_id in (select id from public.providers where user_id = auth.uid()));

drop policy if exists "Public can view discovery sections" on public.discovery_sections;
create policy "Public can view discovery sections"
  on public.discovery_sections
  for select
  using (is_active);

drop policy if exists "Admins manage discovery sections" on public.discovery_sections;
create policy "Admins manage discovery sections"
  on public.discovery_sections
  for all
  using (auth.role() = 'service_role');

drop policy if exists "Public can view discovery items" on public.discovery_section_items;
create policy "Public can view discovery items"
  on public.discovery_section_items
  for select
  using (is_active);

drop policy if exists "Admins manage discovery items" on public.discovery_section_items;
create policy "Admins manage discovery items"
  on public.discovery_section_items
  for all
  using (auth.role() = 'service_role');

select '✅ Provider profile phase 4 tables ready' as status;
