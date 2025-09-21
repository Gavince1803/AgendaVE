-- Comprehensive RLS Test Data Script with Employee System
-- This script creates test data to validate all RLS policies including the new employee functionality

-- First, let's clean up any existing test data
DO $$
BEGIN
  -- Delete in correct order to avoid FK constraints
  DELETE FROM user_favorites WHERE id LIKE 'test-%';
  DELETE FROM reviews WHERE id LIKE 'test-%';
  DELETE FROM appointments WHERE id LIKE 'test-%';
  DELETE FROM employee_availabilities WHERE id LIKE 'test-%';
  DELETE FROM employees WHERE id LIKE 'test-%';
  DELETE FROM availabilities WHERE id LIKE 'test-%';
  DELETE FROM services WHERE id LIKE 'test-%';
  DELETE FROM providers WHERE id LIKE 'test-%';
  DELETE FROM profiles WHERE id LIKE 'test-%';
  DELETE FROM device_push_tokens WHERE id LIKE 'test-%';
  
  -- Delete auth users (this requires service role)
  DELETE FROM auth.users WHERE email LIKE 'test%@agendave.com';
END $$;

-- Create test auth users (requires service role or admin privileges)
-- Note: In production, you'd use Supabase auth API instead

-- Test Providers
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data
) VALUES 
('test-provider-1', 'test.barbershop@agendave.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"name": "Elite Barbershop"}'),
('test-provider-2', 'test.clinic@agendave.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"name": "Health Clinic Plus"}'),
('test-provider-3', 'test.spa@agendave.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"name": "Relax Spa"}');

-- Test Clients
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data
) VALUES 
('test-client-1', 'test.maria@agendave.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"name": "Maria Rodriguez"}'),
('test-client-2', 'test.carlos@agendave.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"name": "Carlos Martinez"}'),
('test-client-3', 'test.ana@agendave.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"name": "Ana Silva"}');

-- Create test profiles
INSERT INTO public.profiles (
  id, role, full_name, email, phone, created_at, updated_at
) VALUES 
-- Provider profiles
('test-provider-1', 'provider', 'Elite Barbershop Owner', 'test.barbershop@agendave.com', '+58-212-1234567', now(), now()),
('test-provider-2', 'provider', 'Health Clinic Admin', 'test.clinic@agendave.com', '+58-212-2345678', now(), now()),
('test-provider-3', 'provider', 'Relax Spa Manager', 'test.spa@agendave.com', '+58-212-3456789', now(), now()),
-- Client profiles
('test-client-1', 'client', 'Maria Rodriguez', 'test.maria@agendave.com', '+58-414-1111111', now(), now()),
('test-client-2', 'client', 'Carlos Martinez', 'test.carlos@agendave.com', '+58-424-2222222', now(), now()),
('test-client-3', 'client', 'Ana Silva', 'test.ana@agendave.com', '+58-416-3333333', now(), now());

-- Create test providers (businesses)
INSERT INTO public.providers (
  id, user_id, business_name, bio, address, phone, email, 
  category, rating, total_reviews, is_active, created_at, updated_at
) VALUES 
('test-provider-1', 'test-provider-1', 'Elite Barbershop', 'Premium barbershop with experienced stylists', 
 'Av. Francisco de Miranda, Las Mercedes', '+58-212-1234567', 'test.barbershop@agendave.com', 
 'barber', 4.8, 25, true, now(), now()),
 
('test-provider-2', 'test-provider-2', 'Health Clinic Plus', 'Comprehensive medical services with specialist doctors', 
 'Calle Real de Sabana Grande', '+58-212-2345678', 'test.clinic@agendave.com', 
 'healthcare', 4.9, 18, true, now(), now()),
 
('test-provider-3', 'test-provider-3', 'Relax Spa', 'Full-service spa with massage and wellness treatments', 
 'Av. Principal de La Castellana', '+58-212-3456789', 'test.spa@agendave.com', 
 'spa', 4.7, 12, true, now(), now());

-- Create test employees (this will test our new employee system!)
INSERT INTO public.employees (
  id, provider_id, name, email, phone, position, is_active, is_owner, 
  custom_schedule_enabled, bio, created_at, updated_at
) VALUES 
-- Elite Barbershop employees
('test-emp-1', 'test-provider-1', 'Roberto Silva', 'roberto@elitebarbershop.com', '+58-414-1010101', 
 'Senior Barber', true, true, false, 'Owner and master barber with 15 years experience', now(), now()),
('test-emp-2', 'test-provider-1', 'Miguel Torres', 'miguel@elitebarbershop.com', '+58-424-2020202', 
 'Junior Barber', true, false, false, 'Specialized in modern cuts and beard styling', now(), now()),
('test-emp-3', 'test-provider-1', 'Juan Perez', 'juan@elitebarbershop.com', '+58-416-3030303', 
 'Hair Stylist', true, false, true, 'Creative stylist available afternoons only', now(), now()),

-- Health Clinic employees
('test-emp-4', 'test-provider-2', 'Dr. Carmen Ramirez', 'carmen@healthclinic.com', '+58-212-4040404', 
 'General Physician', true, true, true, 'Family doctor with 20 years experience', now(), now()),
('test-emp-5', 'test-provider-2', 'Dr. Luis Morales', 'luis@healthclinic.com', '+58-212-5050505', 
 'Cardiologist', true, false, true, 'Heart specialist, available Mon-Wed-Fri', now(), now()),
('test-emp-6', 'test-provider-2', 'Nurse Patricia Lopez', 'patricia@healthclinic.com', '+58-414-6060606', 
 'Registered Nurse', true, false, false, 'Vaccination and basic medical procedures', now(), now()),

-- Relax Spa employees  
('test-emp-7', 'test-provider-3', 'Sofia Gonzalez', 'sofia@relaxspa.com', '+58-424-7070707', 
 'Spa Manager', true, true, false, 'Certified massage therapist and spa owner', now(), now()),
('test-emp-8', 'test-provider-3', 'Isabella Martinez', 'isabella@relaxspa.com', '+58-416-8080808', 
 'Massage Therapist', true, false, false, 'Specialized in deep tissue and Swedish massage', now(), now());

-- Create custom schedules for employees who have custom_schedule_enabled = true
INSERT INTO public.employee_availabilities (
  id, employee_id, day_of_week, start_time, end_time, is_available, created_at, updated_at
) VALUES 
-- Juan (Hair Stylist) - only afternoons, Tuesday to Saturday
('test-empavail-1', 'test-emp-3', 2, '14:00', '20:00', true, now(), now()), -- Tuesday
('test-empavail-2', 'test-emp-3', 3, '14:00', '20:00', true, now(), now()), -- Wednesday
('test-empavail-3', 'test-emp-3', 4, '14:00', '20:00', true, now(), now()), -- Thursday
('test-empavail-4', 'test-emp-3', 5, '14:00', '20:00', true, now(), now()), -- Friday
('test-empavail-5', 'test-emp-3', 6, '12:00', '18:00', true, now(), now()), -- Saturday

-- Dr. Carmen (General Physician) - morning and afternoon slots
('test-empavail-6', 'test-emp-4', 1, '08:00', '12:00', true, now(), now()), -- Monday AM
('test-empavail-7', 'test-emp-4', 1, '14:00', '18:00', true, now(), now()), -- Monday PM
('test-empavail-8', 'test-emp-4', 2, '08:00', '12:00', true, now(), now()), -- Tuesday AM
('test-empavail-9', 'test-emp-4', 3, '14:00', '18:00', true, now(), now()), -- Wednesday PM
('test-empavail-10', 'test-emp-4', 4, '08:00', '12:00', true, now(), now()), -- Thursday AM
('test-empavail-11', 'test-emp-4', 5, '08:00', '12:00', true, now(), now()), -- Friday AM

-- Dr. Luis (Cardiologist) - Mon, Wed, Fri only
('test-empavail-12', 'test-emp-5', 1, '09:00', '17:00', true, now(), now()), -- Monday
('test-empavail-13', 'test-emp-5', 3, '09:00', '17:00', true, now(), now()), -- Wednesday  
('test-empavail-14', 'test-emp-5', 5, '09:00', '17:00', true, now(), now()); -- Friday

-- Create provider availabilities (default schedules)
INSERT INTO public.availabilities (
  id, provider_id, weekday, start_time, end_time, created_at, updated_at
) VALUES
-- Elite Barbershop - Tuesday to Saturday
('test-avail-1', 'test-provider-1', 2, '09:00', '19:00', now(), now()), -- Tuesday
('test-avail-2', 'test-provider-1', 3, '09:00', '19:00', now(), now()), -- Wednesday
('test-avail-3', 'test-provider-1', 4, '09:00', '19:00', now(), now()), -- Thursday
('test-avail-4', 'test-provider-1', 5, '09:00', '19:00', now(), now()), -- Friday
('test-avail-5', 'test-provider-1', 6, '08:00', '18:00', now(), now()), -- Saturday

-- Health Clinic - Monday to Friday
('test-avail-6', 'test-provider-2', 1, '08:00', '18:00', now(), now()), -- Monday
('test-avail-7', 'test-provider-2', 2, '08:00', '18:00', now(), now()), -- Tuesday
('test-avail-8', 'test-provider-2', 3, '08:00', '18:00', now(), now()), -- Wednesday
('test-avail-9', 'test-provider-2', 4, '08:00', '18:00', now(), now()), -- Thursday
('test-avail-10', 'test-provider-2', 5, '08:00', '18:00', now(), now()), -- Friday

-- Relax Spa - Monday to Saturday
('test-avail-11', 'test-provider-3', 1, '10:00', '20:00', now(), now()), -- Monday
('test-avail-12', 'test-provider-3', 2, '10:00', '20:00', now(), now()), -- Tuesday
('test-avail-13', 'test-provider-3', 3, '10:00', '20:00', now(), now()), -- Wednesday
('test-avail-14', 'test-provider-3', 4, '10:00', '20:00', now(), now()), -- Thursday
('test-avail-15', 'test-provider-3', 5, '10:00', '20:00', now(), now()), -- Friday
('test-avail-16', 'test-provider-3', 6, '09:00', '19:00', now(), now()); -- Saturday

-- Create test services
INSERT INTO public.services (
  id, provider_id, name, description, duration_minutes, price_amount, price_currency, 
  is_active, created_at, updated_at
) VALUES 
-- Elite Barbershop services
('test-svc-1', 'test-provider-1', 'Classic Haircut', 'Traditional men\'s haircut with styling', 45, 25.00, 'USD', true, now(), now()),
('test-svc-2', 'test-provider-1', 'Beard Trim & Shape', 'Professional beard trimming and shaping', 30, 15.00, 'USD', true, now(), now()),
('test-svc-3', 'test-provider-1', 'Premium Cut & Wash', 'Haircut with wash and premium styling products', 60, 40.00, 'USD', true, now(), now()),

-- Health Clinic services
('test-svc-4', 'test-provider-2', 'General Consultation', 'General medical consultation and examination', 30, 50.00, 'USD', true, now(), now()),
('test-svc-5', 'test-provider-2', 'Cardiology Consultation', 'Specialized heart and cardiovascular consultation', 45, 100.00, 'USD', true, now(), now()),
('test-svc-6', 'test-provider-2', 'Vaccination Service', 'Vaccine administration and health record update', 15, 30.00, 'USD', true, now(), now()),

-- Relax Spa services
('test-svc-7', 'test-provider-3', 'Swedish Massage', 'Relaxing full-body Swedish massage therapy', 60, 80.00, 'USD', true, now(), now()),
('test-svc-8', 'test-provider-3', 'Deep Tissue Massage', 'Therapeutic deep tissue massage for muscle tension', 90, 120.00, 'USD', true, now(), now()),
('test-svc-9', 'test-provider-3', 'Facial Treatment', 'Rejuvenating facial with premium skincare products', 75, 95.00, 'USD', true, now(), now());

-- Create test appointments (including employee assignments)
INSERT INTO public.appointments (
  id, provider_id, client_id, service_id, employee_id, 
  appointment_date, appointment_time, status, notes, created_at, updated_at
) VALUES 
-- Appointments with different employees at Elite Barbershop
('test-appt-1', 'test-provider-1', 'test-client-1', 'test-svc-1', 'test-emp-1', 
 '2024-01-15', '10:00', 'confirmed', 'Regular customer, prefers classic style', now(), now()),

('test-appt-2', 'test-provider-1', 'test-client-2', 'test-svc-2', 'test-emp-2', 
 '2024-01-15', '14:30', 'pending', 'First time customer', now(), now()),

('test-appt-3', 'test-provider-1', 'test-client-3', 'test-svc-3', 'test-emp-3', 
 '2024-01-16', '16:00', 'confirmed', 'Special occasion haircut', now(), now()),

-- Medical appointments with specific doctors
('test-appt-4', 'test-provider-2', 'test-client-1', 'test-svc-4', 'test-emp-4', 
 '2024-01-17', '09:00', 'confirmed', 'Annual checkup', now(), now()),

('test-appt-5', 'test-provider-2', 'test-client-2', 'test-svc-5', 'test-emp-5', 
 '2024-01-17', '10:00', 'pending', 'Heart consultation', now(), now()),

-- Spa appointments
('test-appt-6', 'test-provider-3', 'test-client-3', 'test-svc-7', 'test-emp-8', 
 '2024-01-18', '15:00', 'confirmed', 'Relaxation therapy', now(), now());

-- Create test reviews (now referencing specific employees)
INSERT INTO public.reviews (
  id, provider_id, client_id, employee_id, appointment_id, rating, comment, created_at, updated_at
) VALUES 
('test-review-1', 'test-provider-1', 'test-client-1', 'test-emp-1', 'test-appt-1', 5, 
 'Roberto gave me the best haircut I\'ve had in years! Highly professional.', now(), now()),
('test-review-2', 'test-provider-2', 'test-client-1', 'test-emp-4', 'test-appt-4', 5, 
 'Dr. Carmen was very thorough and caring during my checkup. Excellent service!', now(), now()),
('test-review-3', 'test-provider-3', 'test-client-3', 'test-emp-8', 'test-appt-6', 4, 
 'Isabella\'s massage technique was amazing. Very relaxing experience.', now(), now());

-- Create test user favorites
INSERT INTO public.user_favorites (
  id, user_id, provider_id, created_at
) VALUES 
('test-fav-1', 'test-client-1', 'test-provider-1', now()),
('test-fav-2', 'test-client-1', 'test-provider-2', now()),
('test-fav-3', 'test-client-2', 'test-provider-3', now()),
('test-fav-4', 'test-client-3', 'test-provider-1', now());

-- Create test device push tokens
INSERT INTO public.device_push_tokens (
  id, user_id, token, platform, created_at, updated_at
) VALUES 
('test-token-1', 'test-client-1', 'ExponentPushToken[test-maria-token-123]', 'ios', now(), now()),
('test-token-2', 'test-client-2', 'ExponentPushToken[test-carlos-token-456]', 'android', now(), now()),
('test-token-3', 'test-provider-1', 'ExponentPushToken[test-barber-token-789]', 'ios', now(), now());

-- Output summary
SELECT 'Employee System Test Data Created Successfully!' as status;

-- Show summary of created test data
SELECT 
  'Test Users Created' as category,
  COUNT(*) as count
FROM auth.users 
WHERE email LIKE 'test%@agendave.com'

UNION ALL

SELECT 
  'Test Profiles Created' as category,
  COUNT(*) as count
FROM profiles 
WHERE id LIKE 'test-%'

UNION ALL

SELECT 
  'Test Employees Created' as category,
  COUNT(*) as count
FROM employees 
WHERE id LIKE 'test-%'

UNION ALL

SELECT 
  'Employee Custom Schedules' as category,
  COUNT(*) as count
FROM employee_availabilities 
WHERE id LIKE 'test-%'

UNION ALL

SELECT 
  'Test Appointments with Employees' as category,
  COUNT(*) as count
FROM appointments 
WHERE id LIKE 'test-%' AND employee_id IS NOT NULL;