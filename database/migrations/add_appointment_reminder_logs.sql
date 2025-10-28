-- Tracks automated reminder notifications to avoid duplicate sends

create table if not exists public.appointment_reminder_logs (
    id uuid not null default gen_random_uuid() primary key,
    appointment_id uuid not null references public.appointments(id) on delete cascade,
    provider_id uuid not null references public.providers(id) on delete cascade,
    client_id uuid not null references public.profiles(id) on delete cascade,
    channel text not null default 'push',
    reminder_sent_at timestamptz not null default now(),
    metadata jsonb,
    created_at timestamptz not null default now()
);

create unique index if not exists appointment_reminder_unique_channel
    on public.appointment_reminder_logs (appointment_id, channel);

create index if not exists appointment_reminder_sent_at_idx
    on public.appointment_reminder_logs (reminder_sent_at desc);

comment on table public.appointment_reminder_logs is 'Stores logs of automated appointment reminders (push/email/SMS) to prevent duplicate sends.';
