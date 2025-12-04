-- Creates provider_settings table to persist scheduling preferences, buffers and cancellation policies
-- Safe to run multiple times thanks to IF NOT EXISTS guards

create table if not exists public.provider_settings (
    provider_id uuid primary key references public.providers (id) on delete cascade,
    buffer_before_minutes integer not null default 10,
    buffer_after_minutes integer not null default 10,
    allow_overlaps boolean not null default false,
    cancellation_policy_hours integer not null default 12,
    cancellation_policy_message text,
    reminder_lead_time_minutes integer not null default 60,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.provider_settings is 'Stores per-provider scheduling settings (buffers, overlaps, reminders, cancellation policy).';

create index if not exists provider_settings_provider_idx on public.provider_settings(provider_id);

create or replace function public.set_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_provider_settings_updated_at on public.provider_settings;

create trigger set_provider_settings_updated_at
before update on public.provider_settings
for each row
execute function public.set_timestamp_updated_at();

select '✅ provider_settings table ready' as status;
