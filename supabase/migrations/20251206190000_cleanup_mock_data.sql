-- Clean up initial mock data
-- This removes the specific test accounts created by the seed files

-- 0. Remove Appointments first to avoid constraint violations (appointment_future_date)
-- when foreign keys try to set employee_id to NULL on past appointments.
DELETE FROM public.appointments WHERE provider_id IN (
  '650e8400-e29b-41d4-a716-446655440001', -- Elite Barbershop
  '650e8400-e29b-41d4-a716-446655440002', -- Relaxing Spa
  '650e8400-e29b-41d4-a716-446655440003'  -- Health Plus Clinic
);

-- 1. Remove Providers (and cascades to employees, services, etc.)
DELETE FROM public.providers WHERE id IN (
  '650e8400-e29b-41d4-a716-446655440001', -- Elite Barbershop
  '650e8400-e29b-41d4-a716-446655440002', -- Relaxing Spa
  '650e8400-e29b-41d4-a716-446655440003'  -- Health Plus Clinic
);

-- 2. Remove Profiles
DELETE FROM public.profiles WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003'
);

-- 3. Remove Auth Users (Requires permissions on auth schema)
-- Note: If running via Supabase Dashboard SQL Editor, this usually works.
-- If running via migration tool with restricted permissions, this might fail or be ignored.
-- Ideally, we use the delete_own_user RPC logic or similar administrative function,
-- but standard migrations run as postgres/service_role often have access.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') THEN
    DELETE FROM auth.users WHERE id IN (
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
      '550e8400-e29b-41d4-a716-446655440003'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not delete from auth.users (likely permission denied). Please delete manually from Auth dashboard.';
END $$;
