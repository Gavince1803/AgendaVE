-- 🧹 Beta Launch Data Cleanup
-- Clean all test data for fresh beta start
-- ⚠️ WARNING: This deletes ALL existing data!

BEGIN;

-- Delete all appointments (and their reviews via cascade)
DELETE FROM public.appointments WHERE true;

-- Delete all availabilities 
DELETE FROM public.availabilities WHERE true;

-- Delete all services
DELETE FROM public.services WHERE true;

-- Delete all user favorites
DELETE FROM public.user_favorites WHERE true;

-- Delete all providers (but keep user profiles)
DELETE FROM public.providers WHERE true;

-- Delete all device push tokens
DELETE FROM public.device_push_tokens WHERE true;

-- Verify cleanup
SELECT 
    'Data cleanup completed! ✅' as status,
    (SELECT COUNT(*) FROM public.appointments) as appointments_remaining,
    (SELECT COUNT(*) FROM public.services) as services_remaining,
    (SELECT COUNT(*) FROM public.providers) as providers_remaining;

COMMIT;