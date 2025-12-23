-- Enable Realtime for notifications table
-- This is required for the NotificationBell to update instantly when a new notification arrives.
begin;
  -- Check if the table is already in the publication to avoid errors
  do $$
  begin
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
    ) then
      alter publication supabase_realtime add table public.notifications;
    end if;
  end
  $$;
commit;
