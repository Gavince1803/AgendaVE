-- 🧹 Production Data Cleanup Script
-- Run this script to clean all test/mock data before beta launch
-- ⚠️  WARNING: This will delete ALL existing data!

BEGIN;

-- 1. Delete all appointments (cascade will handle reviews)
DELETE FROM public.appointments WHERE true;

-- 2. Delete all availabilities 
DELETE FROM public.availabilities WHERE true;

-- 3. Delete all services
DELETE FROM public.services WHERE true;

-- 4. Delete all providers
DELETE FROM public.providers WHERE true;

-- 5. Delete all user favorites
DELETE FROM public.user_favorites WHERE true;

-- 6. Delete all push tokens
DELETE FROM public.device_push_tokens WHERE true;

-- 7. Delete all profiles (except don't delete auth.users - that's managed by Supabase Auth)
DELETE FROM public.profiles WHERE true;

-- 8. Reset all sequences (if any)
-- (Your UUIDs don't need sequence resets)

-- 9. Verify all tables are empty
DO $$
DECLARE
    table_name TEXT;
    row_count INTEGER;
BEGIN
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t 
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND t.table_name NOT LIKE '%_old%'
    LOOP
        EXECUTE 'SELECT COUNT(*) FROM public.' || quote_ident(table_name) INTO row_count;
        RAISE NOTICE 'Table %: % rows', table_name, row_count;
    END LOOP;
END $$;

COMMIT;

-- 10. Optional: Add constraint to prevent accidental test data in production
-- Uncomment the following if you want extra safety:

/*
-- Add a check to prevent providers with test emails
ALTER TABLE public.providers ADD CONSTRAINT no_test_emails 
CHECK (email NOT ILIKE '%test%' AND email NOT ILIKE '%example%');

-- Add a check to prevent profiles with test names  
ALTER TABLE public.profiles ADD CONSTRAINT no_test_profiles
CHECK (full_name NOT ILIKE '%test%' AND display_name NOT ILIKE '%test%');
*/

-- Success message
SELECT 'Production cleanup completed successfully! ✅' as status;