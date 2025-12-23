-- Allow any authenticated user to insert notifications
-- This is necessary so that a Client can trigger a notification for a Provider (and vice-versa)
-- The previous policy (if it existed) might have restricted inserts to 'own' user_id only (auth.uid() = user_id), which prevents sending to others.

drop policy if exists "System can insert notifications" on public.notifications;
drop policy if exists "Users can insert notifications" on public.notifications;

create policy "Users can insert notifications"
  on public.notifications for insert
  with check (auth.role() = 'authenticated');
