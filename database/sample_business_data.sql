-- Sample Business Data with Employee System
-- This creates complete sample data including providers, services, and employees

-- First, let's create some sample auth users for providers
-- Note: In a real app, these would be created through Supabase Auth API

INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, role
) VALUES 
-- Barbershop Owner
('550e8400-e29b-41d4-a716-446655440001', 'barbershop@demo.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"name": "Elite Barbershop"}', 'authenticated'),
-- Spa Owner  
('550e8400-e29b-41d4-a716-446655440002', 'spa@demo.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"name": "Relaxing Spa"}', 'authenticated'),
-- Clinic Owner
('550e8400-e29b-41d4-a716-446655440003', 'clinic@demo.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"name": "Health Clinic"}', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Create corresponding profiles for the providers
INSERT INTO public.profiles (
  id, email, full_name, display_name, role, phone, created_at, updated_at
) VALUES
-- Barbershop Profile
('550e8400-e29b-41d4-a716-446655440001', 'barbershop@demo.com', 'Roberto Silva', 'Roberto Silva', 'provider', '+58-212-1234567', now(), now()),
-- Spa Profile
('550e8400-e29b-41d4-a716-446655440002', 'spa@demo.com', 'Sofia Martinez', 'Sofia Martinez', 'provider', '+58-212-2345678', now(), now()),
-- Clinic Profile
('550e8400-e29b-41d4-a716-446655440003', 'clinic@demo.com', 'Dr. Carmen Lopez', 'Dr. Carmen Lopez', 'provider', '+58-212-3456789', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Create the provider businesses (this will automatically create owner employees!)
INSERT INTO public.providers (
  id, user_id, business_name, bio, address, phone, email, category, rating, total_reviews, is_active, created_at, updated_at
) VALUES 
-- Elite Barbershop
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 
 'Elite Barbershop', 
 'Premium barbershop specializing in classic and modern cuts for gentlemen',
 'Av. Francisco de Miranda, Las Mercedes, Caracas', 
 '+58-212-1234567', 'barbershop@demo.com', 'barber', 4.8, 25, true, now(), now()),

-- Relaxing Spa  
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002',
 'Relaxing Spa',
 'Full-service spa offering massage therapy, facials, and wellness treatments',
 'Centro Comercial San Ignacio, Caracas',
 '+58-212-2345678', 'spa@demo.com', 'spa', 4.9, 18, true, now(), now()),

-- Health Plus Clinic
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003',
 'Health Plus Clinic',
 'Modern medical clinic with general practitioners and specialists',
 'Av. Principal de Las Mercedes, Caracas',
 '+58-212-3456789', 'clinic@demo.com', 'healthcare', 4.7, 12, true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Wait a moment and then add additional employees to each business
-- (The owners should have been auto-created by the trigger)

-- Add employees to Elite Barbershop
INSERT INTO public.employees (provider_id, name, email, phone, position, is_active, is_owner, custom_schedule_enabled, bio)
VALUES 
('650e8400-e29b-41d4-a716-446655440001', 'Miguel Torres', 'miguel@elitebarbershop.com', '+58-414-1010101', 'Senior Barber', true, false, false, 'Expert in beard styling and traditional cuts'),
('650e8400-e29b-41d4-a716-446655440001', 'Juan Carlos', 'juan@elitebarbershop.com', '+58-424-2020202', 'Junior Barber', true, false, true, 'Modern cuts specialist, available afternoons');

-- Add employees to Relaxing Spa
INSERT INTO public.employees (provider_id, name, email, phone, position, is_active, is_owner, custom_schedule_enabled, bio)
VALUES 
('650e8400-e29b-41d4-a716-446655440002', 'Isabella Rodriguez', 'isabella@relaxingspa.com', '+58-414-3030303', 'Senior Therapist', true, false, false, 'Certified in Swedish and deep tissue massage'),
('650e8400-e29b-41d4-a716-446655440002', 'Carmen Perez', 'carmen@relaxingspa.com', '+58-424-4040404', 'Aesthetician', true, false, false, 'Facial treatments and skincare specialist');

-- Add employees to Health Plus Clinic
INSERT INTO public.employees (provider_id, name, email, phone, position, is_active, is_owner, custom_schedule_enabled, bio)
VALUES 
('650e8400-e29b-41d4-a716-446655440003', 'Dr. Luis Morales', 'luis@healthplus.com', '+58-414-5050505', 'General Physician', true, false, true, 'Family medicine, available Mon-Wed-Fri'),
('650e8400-e29b-41d4-a716-446655440003', 'Nurse Ana Silva', 'ana@healthplus.com', '+58-424-6060606', 'Registered Nurse', true, false, false, 'Vaccinations and basic procedures');

-- Add custom schedules for employees with custom_schedule_enabled = true

-- Juan Carlos (Barbershop) - Afternoons only, Tue-Sat
INSERT INTO public.employee_availabilities (employee_id, day_of_week, start_time, end_time, is_available)
SELECT e.id, day_num, start_t, end_t, true
FROM employees e
CROSS JOIN (VALUES 
  (2, '14:00'::time, '19:00'::time), -- Tuesday
  (3, '14:00'::time, '19:00'::time), -- Wednesday  
  (4, '14:00'::time, '19:00'::time), -- Thursday
  (5, '14:00'::time, '19:00'::time), -- Friday
  (6, '10:00'::time, '18:00'::time)  -- Saturday
) AS schedule(day_num, start_t, end_t)
WHERE e.name = 'Juan Carlos' AND e.custom_schedule_enabled = true;

-- Dr. Luis Morales (Clinic) - Mon, Wed, Fri only
INSERT INTO public.employee_availabilities (employee_id, day_of_week, start_time, end_time, is_available)
SELECT e.id, day_num, start_t, end_t, true
FROM employees e
CROSS JOIN (VALUES 
  (1, '08:00'::time, '17:00'::time), -- Monday
  (3, '08:00'::time, '17:00'::time), -- Wednesday
  (5, '08:00'::time, '17:00'::time)  -- Friday
) AS schedule(day_num, start_t, end_t)
WHERE e.name = 'Dr. Luis Morales' AND e.custom_schedule_enabled = true;

-- Add some provider availabilities (business hours)
INSERT INTO public.availabilities (provider_id, weekday, start_time, end_time, is_active)
VALUES 
-- Elite Barbershop: Tue-Sat
('650e8400-e29b-41d4-a716-446655440001', 2, '09:00', '19:00', true), -- Tuesday
('650e8400-e29b-41d4-a716-446655440001', 3, '09:00', '19:00', true), -- Wednesday
('650e8400-e29b-41d4-a716-446655440001', 4, '09:00', '19:00', true), -- Thursday
('650e8400-e29b-41d4-a716-446655440001', 5, '09:00', '19:00', true), -- Friday
('650e8400-e29b-41d4-a716-446655440001', 6, '08:00', '18:00', true), -- Saturday

-- Relaxing Spa: Mon-Sat
('650e8400-e29b-41d4-a716-446655440002', 1, '10:00', '20:00', true), -- Monday
('650e8400-e29b-41d4-a716-446655440002', 2, '10:00', '20:00', true), -- Tuesday
('650e8400-e29b-41d4-a716-446655440002', 3, '10:00', '20:00', true), -- Wednesday
('650e8400-e29b-41d4-a716-446655440002', 4, '10:00', '20:00', true), -- Thursday
('650e8400-e29b-41d4-a716-446655440002', 5, '10:00', '20:00', true), -- Friday
('650e8400-e29b-41d4-a716-446655440002', 6, '09:00', '19:00', true), -- Saturday

-- Health Plus Clinic: Mon-Fri
('650e8400-e29b-41d4-a716-446655440003', 1, '08:00', '18:00', true), -- Monday
('650e8400-e29b-41d4-a716-446655440003', 2, '08:00', '18:00', true), -- Tuesday
('650e8400-e29b-41d4-a716-446655440003', 3, '08:00', '18:00', true), -- Wednesday
('650e8400-e29b-41d4-a716-446655440003', 4, '08:00', '18:00', true), -- Thursday
('650e8400-e29b-41d4-a716-446655440003', 5, '08:00', '18:00', true); -- Friday

-- Add some services for each provider
INSERT INTO public.services (provider_id, name, description, price_amount, price_currency, duration_minutes, is_active)
VALUES 
-- Elite Barbershop Services
('650e8400-e29b-41d4-a716-446655440001', 'Classic Haircut', 'Traditional haircut with styling', 25.00, 'USD', 45, true),
('650e8400-e29b-41d4-a716-446655440001', 'Beard Trim', 'Professional beard trimming and shaping', 15.00, 'USD', 30, true),
('650e8400-e29b-41d4-a716-446655440001', 'Premium Package', 'Haircut + beard trim + hot towel treatment', 40.00, 'USD', 75, true),

-- Relaxing Spa Services
('650e8400-e29b-41d4-a716-446655440002', 'Swedish Massage', 'Full body relaxation massage', 80.00, 'USD', 60, true),
('650e8400-e29b-41d4-a716-446655440002', 'Deep Tissue Massage', 'Therapeutic muscle tension relief', 100.00, 'USD', 90, true),
('650e8400-e29b-41d4-a716-446655440002', 'Facial Treatment', 'Cleansing and rejuvenating facial', 65.00, 'USD', 75, true),

-- Health Plus Clinic Services
('650e8400-e29b-41d4-a716-446655440003', 'General Consultation', 'Routine medical examination', 50.00, 'USD', 30, true),
('650e8400-e29b-41d4-a716-446655440003', 'Specialist Consultation', 'Specialized medical consultation', 100.00, 'USD', 45, true),
('650e8400-e29b-41d4-a716-446655440003', 'Vaccination', 'Immunization service', 30.00, 'USD', 15, true);

-- Show final results
SELECT 'Sample Data Created Successfully!' as status;

-- Display summary
SELECT 'BUSINESSES CREATED:' as section;
SELECT business_name, category, rating FROM providers;

SELECT 'EMPLOYEES BY BUSINESS:' as section;
SELECT 
  p.business_name as business,
  e.name as employee,
  e.position,
  e.is_owner,
  e.custom_schedule_enabled
FROM employees e
JOIN providers p ON p.id = e.provider_id
ORDER BY p.business_name, e.is_owner DESC, e.name;

SELECT 'EMPLOYEES WITH CUSTOM SCHEDULES:' as section;
SELECT 
  p.business_name as business,
  e.name as employee,
  CASE ea.day_of_week 
    WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday' WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday' WHEN 6 THEN 'Saturday'
  END as day,
  ea.start_time || ' - ' || ea.end_time as hours
FROM employee_availabilities ea
JOIN employees e ON e.id = ea.employee_id  
JOIN providers p ON p.id = e.provider_id
ORDER BY p.business_name, e.name, ea.day_of_week;