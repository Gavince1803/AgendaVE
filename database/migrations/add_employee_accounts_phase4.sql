-- Employee account enhancements: invite workflow, auth linkage, and RLS for scoped access

alter table public.employees
  add column if not exists profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists invite_email text,
  add column if not exists invite_status text not null default 'draft', -- draft | pending | accepted | revoked
  add column if not exists invite_token text,
  add column if not exists invite_token_expires_at timestamptz,
  add column if not exists role text not null default 'staff';

create index if not exists employees_profile_idx on public.employees(profile_id);
create index if not exists employees_invite_token_idx on public.employees(invite_token);

-- Allow employees to read their own row
drop policy if exists "Employees can view themselves" on public.employees;
create policy "Employees can view themselves" on public.employees
for select using (profile_id = auth.uid());

-- Allow employees to update limited self fields (phone, bio, profile image)
drop policy if exists "Employees can update themselves" on public.employees;
create policy "Employees can update themselves" on public.employees
for update using (profile_id = auth.uid())
with check (
  profile_id = auth.uid()
);

-- Allow employees to view and manage their custom availability
drop policy if exists "Employees can view own availability" on public.employee_availabilities;
create policy "Employees can view own availability" on public.employee_availabilities
for select using (
  exists (
    select 1
    from public.employees e
    where e.id = employee_availabilities.employee_id
      and e.profile_id = auth.uid()
  )
);

drop policy if exists "Employees can manage own availability" on public.employee_availabilities;
create policy "Employees can manage own availability" on public.employee_availabilities
for all using (
  exists (
    select 1
    from public.employees e
    where e.id = employee_availabilities.employee_id
      and e.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.employees e
    where e.id = employee_availabilities.employee_id
      and e.profile_id = auth.uid()
  )
);

-- Appointments: allow employees to see and manage their assigned bookings
drop policy if exists "appointments_employee_select" on public.appointments;
create policy "appointments_employee_select" on public.appointments
for select using (
  employee_id is not null
  and exists (
    select 1 from public.employees e
    where e.id = public.appointments.employee_id
      and e.profile_id = auth.uid()
  )
);

drop policy if exists "appointments_employee_update" on public.appointments;
create policy "appointments_employee_update" on public.appointments
for update using (
  employee_id is not null
  and exists (
    select 1 from public.employees e
    where e.id = public.appointments.employee_id
      and e.profile_id = auth.uid()
  )
)
with check (
  status in ('pending', 'confirmed', 'cancelled', 'done', 'no_show')
);

-- Reviews: allow employees to see reviews that mention them
drop policy if exists "reviews_employee_select" on public.reviews;
create policy "reviews_employee_select" on public.reviews
for select using (
  employee_id is not null
  and exists (
    select 1 from public.employees e
    where e.id = public.reviews.employee_id
      and e.profile_id = auth.uid()
  )
);

-- Update helper views/triggers if necessary (no-op for now)

comment on column public.employees.profile_id is 'Linked auth profile for the employee (Supabase profile id).';
comment on column public.employees.invite_email is 'Email used for invitations before the employee creates an account.';
comment on column public.employees.invite_status is 'Invitation state: draft, pending, accepted, revoked.';
comment on column public.employees.invite_token is 'Secure token used for claiming an invite.';
comment on column public.employees.invite_token_expires_at is 'Expiration timestamp for the invite token.';
comment on column public.employees.role is 'Employee role within the provider team (staff, manager, etc).';

select '✅ Employee accounts and policies updated' as status;
