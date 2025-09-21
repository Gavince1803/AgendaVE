-- 🧪 RLS Testing Data Script (FIXED)
-- Creates test users, providers, services, and appointments to verify security
-- ⚠️ This creates test data - use only for testing RLS policies!

BEGIN;

-- First, let's create some test users in auth.users (this simulates registration)
-- Note: In real app, Supabase Auth handles this, but for testing we'll insert directly

-- Insert test auth users (bypassing normal auth flow for testing)
INSERT INTO auth.users (
    id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    created_at, 
    updated_at,
    raw_user_meta_data,
    role
) VALUES 
-- Test Client 1
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'cliente1@test.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"full_name": "María González", "role": "client"}'::jsonb,
    'authenticated'
),
-- Test Client 2  
(
    '22222222-2222-2222-2222-222222222222'::uuid,
    'cliente2@test.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"full_name": "Carlos Rodríguez", "role": "client"}'::jsonb,
    'authenticated'
),
-- Test Provider 1
(
    '33333333-3333-3333-3333-333333333333'::uuid,
    'proveedor1@test.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"full_name": "Ana Pérez", "role": "provider"}'::jsonb,
    'authenticated'
),
-- Test Provider 2
(
    '44444444-4444-4444-4444-444444444444'::uuid,
    'proveedor2@test.com', 
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"full_name": "Luis Martínez", "role": "provider"}'::jsonb,
    'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Create corresponding profiles
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    display_name,
    role,
    phone
) VALUES
-- Client 1 Profile
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'cliente1@test.com',
    'María González',
    'María González',
    'client',
    '+58 424 123 4567'
),
-- Client 2 Profile  
(
    '22222222-2222-2222-2222-222222222222'::uuid,
    'cliente2@test.com',
    'Carlos Rodríguez',
    'Carlos Rodríguez', 
    'client',
    '+58 414 234 5678'
),
-- Provider 1 Profile
(
    '33333333-3333-3333-3333-333333333333'::uuid,
    'proveedor1@test.com',
    'Ana Pérez',
    'Ana Pérez',
    'provider',
    '+58 426 345 6789'
),
-- Provider 2 Profile
(
    '44444444-4444-4444-4444-444444444444'::uuid,
    'proveedor2@test.com',
    'Luis Martínez', 
    'Luis Martínez',
    'provider',
    '+58 412 456 7890'
)
ON CONFLICT (id) DO NOTHING;

-- Create provider business profiles (FIXED - removed website column)
INSERT INTO public.providers (
    id,
    user_id,
    business_name,
    bio,
    address,
    phone,
    email,
    category,
    rating,
    total_reviews,
    is_active
) VALUES
-- Provider 1 Business
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    'Salón de Belleza Ana',
    'Especialistas en cortes modernos y tratamientos capilares',
    'Av. Principal, Centro, Caracas',
    '+58 426 345 6789',
    'salon@anabeauty.com',
    'hair',
    4.8,
    25,
    true
),
-- Provider 2 Business
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    'Barbería Clásica Luis',
    'Cortes tradicionales y modernos para caballeros',
    'Calle 5, Las Mercedes, Caracas',
    '+58 412 456 7890',
    'info@luisbarbershop.com',
    'barber',
    4.9,
    18,
    true
);

-- Create services for each provider
INSERT INTO public.services (
    id,
    provider_id,
    name,
    description,
    price_amount,
    price_currency,
    duration_minutes,
    is_active
) VALUES
-- Ana's Services
(
    gen_random_uuid(),
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'Corte de Cabello Dama',
    'Corte profesional con asesoría de estilo',
    25.00,
    'USD',
    45,
    true
),
(
    gen_random_uuid(),
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'Tratamiento Capilar',
    'Hidratación profunda y reparación',
    35.00,
    'USD',
    60,
    true
),
(
    gen_random_uuid(),
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'Peinado Especial',
    'Peinado para eventos y ocasiones especiales',
    40.00,
    'USD',
    75,
    true
),
-- Luis's Services
(
    gen_random_uuid(),
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    'Corte Clásico Caballero',
    'Corte tradicional con navaja y detalles',
    15.00,
    'USD',
    30,
    true
),
(
    gen_random_uuid(),
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    'Corte + Barba',
    'Corte completo con arreglo de barba',
    22.00,
    'USD',
    45,
    true
),
(
    gen_random_uuid(),
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    'Afeitado Clásico',
    'Afeitado tradicional con toallas calientes',
    12.00,
    'USD',
    25,
    false  -- Inactive service for testing
);

-- Create availability schedules
INSERT INTO public.availabilities (
    id,
    provider_id,
    weekday,
    start_time,
    end_time,
    is_active
) VALUES
-- Ana's Schedule (Monday to Saturday)
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 1, '09:00', '17:00', true), -- Monday
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 2, '09:00', '17:00', true), -- Tuesday  
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 3, '09:00', '17:00', true), -- Wednesday
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 4, '09:00', '17:00', true), -- Thursday
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 5, '09:00', '17:00', true), -- Friday
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 6, '09:00', '15:00', true), -- Saturday
-- Luis's Schedule (Tuesday to Sunday)
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 2, '10:00', '19:00', true), -- Tuesday
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 3, '10:00', '19:00', true), -- Wednesday
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 4, '10:00', '19:00', true), -- Thursday  
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 5, '10:00', '19:00', true), -- Friday
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 6, '10:00', '19:00', true), -- Saturday
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 0, '11:00', '17:00', true); -- Sunday

-- Create some test appointments
INSERT INTO public.appointments (
    id,
    client_id,
    provider_id, 
    service_id,
    appointment_date,
    appointment_time,
    status,
    notes
) VALUES
-- María books with Ana
(
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    (SELECT id FROM public.services WHERE provider_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid LIMIT 1),
    CURRENT_DATE + INTERVAL '2 days',
    '10:00',
    'pending',
    'Primera vez en el salón'
),
-- Carlos books with Luis  
(
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    (SELECT id FROM public.services WHERE provider_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid LIMIT 1),
    CURRENT_DATE + INTERVAL '3 days', 
    '14:00',
    'confirmed',
    'Corte regular'
),
-- Past completed appointment for review testing
(
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    (SELECT id FROM public.services WHERE provider_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid LIMIT 1),
    CURRENT_DATE - INTERVAL '5 days',
    '15:30',
    'done',
    'Excelente servicio'
);

-- Create some reviews for completed appointments
INSERT INTO public.reviews (
    id,
    appointment_id,
    client_id,
    provider_id,
    rating,
    comment
) VALUES
(
    gen_random_uuid(),
    (SELECT id FROM public.appointments WHERE status = 'done' LIMIT 1),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    5,
    'Excelente servicio, muy profesional y el resultado quedó perfecto. Recomendado 100%'
);

-- Create some user favorites
INSERT INTO public.user_favorites (
    id,
    user_id,
    provider_id
) VALUES
(
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
),
(
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
);

COMMIT;

-- Verification queries
SELECT 'RLS Test Data Created Successfully! 🧪' as status;

-- Show summary of created data
SELECT 'Test Users Created:' as summary, COUNT(*) as count FROM auth.users WHERE email LIKE '%@test.com'
UNION ALL
SELECT 'Profiles Created:', COUNT(*) FROM public.profiles WHERE email LIKE '%@test.com'
UNION ALL  
SELECT 'Providers Created:', COUNT(*) FROM public.providers WHERE business_name LIKE '%Test%' OR business_name LIKE '%Ana%' OR business_name LIKE '%Luis%'
UNION ALL
SELECT 'Services Created:', COUNT(*) FROM public.services WHERE provider_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid)
UNION ALL
SELECT 'Appointments Created:', COUNT(*) FROM public.appointments WHERE client_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid)
UNION ALL
SELECT 'Reviews Created:', COUNT(*) FROM public.reviews WHERE client_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid)
UNION ALL
SELECT 'Favorites Created:', COUNT(*) FROM public.user_favorites WHERE user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid);