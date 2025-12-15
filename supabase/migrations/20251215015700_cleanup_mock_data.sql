-- Migration to clean up mock data (Elite Barbershop, Relaxing Spa, Health Plus Clinic)

-- Delete providers (cascade should handle related services, employees, appointments if set up correctly, 
-- but we will be explicit for safety or rely on cascade if constraints exist)

-- 1. Elite Barbershop
DELETE FROM public.providers WHERE id = '650e8400-e29b-41d4-a716-446655440001';

-- 2. Relaxing Spa
DELETE FROM public.providers WHERE id = '650e8400-e29b-41d4-a716-446655440002';

-- 3. Health Plus Clinic
DELETE FROM public.providers WHERE id = '650e8400-e29b-41d4-a716-446655440003';

-- Delete auth users and profiles associated with these mocks
-- Note: In Supabase, deleting from auth.users usually cascades to public.profiles if referenced by constraint.
-- If not, we delete manually.

DELETE FROM auth.users WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440001', -- Elite Barbershop Owner
    '550e8400-e29b-41d4-a716-446655440002', -- Relaxing Spa Owner
    '550e8400-e29b-41d4-a716-446655440003'  -- Health Plus Clinic Owner
);

-- Also ensure profiles are gone if no cascade
DELETE FROM public.profiles WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003'
);
