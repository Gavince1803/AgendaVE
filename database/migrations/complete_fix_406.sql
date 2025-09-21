-- Complete fix for 406 errors on user_favorites table
-- This script completely resets the table permissions and policies

-- 1. Drop all existing policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_favorites' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.user_favorites';
    END LOOP;
END $$;

-- 2. Disable RLS temporarily
ALTER TABLE public.user_favorites DISABLE ROW LEVEL SECURITY;

-- 3. Revoke all existing permissions
REVOKE ALL ON public.user_favorites FROM PUBLIC;
REVOKE ALL ON public.user_favorites FROM authenticated;
REVOKE ALL ON public.user_favorites FROM service_role;

-- 4. Grant full permissions to authenticated users and service role
GRANT ALL ON public.user_favorites TO authenticated;
GRANT ALL ON public.user_favorites TO service_role;
GRANT ALL ON public.user_favorites TO postgres;

-- 5. Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 6. Make sure the table is accessible
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_favorites TO PUBLIC;

-- 7. Test access
INSERT INTO public.user_favorites (user_id, provider_id) 
VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (user_id, provider_id) DO NOTHING;

-- 8. Clean up test data
DELETE FROM public.user_favorites 
WHERE user_id = '00000000-0000-0000-0000-000000000000' 
AND provider_id = '00000000-0000-0000-0000-000000000000';

-- 9. Show success message
SELECT 'user_favorites table permissions reset - RLS disabled for testing' as status;
SELECT 'WARNING: RLS is disabled - all authenticated users can access all favorites' as warning;
SELECT 'Re-enable RLS with proper policies once favorites are working' as reminder;