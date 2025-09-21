-- Temporary fix: Disable RLS for user_favorites table for testing
-- This script temporarily disables RLS to test if that's causing the 406 error
-- WARNING: This makes the table accessible to all authenticated users
-- Only use this for testing, then enable RLS again with proper policies

-- Disable RLS on user_favorites table
ALTER TABLE public.user_favorites DISABLE ROW LEVEL SECURITY;

-- Ensure permissions are granted
GRANT ALL ON public.user_favorites TO authenticated;
GRANT ALL ON public.user_favorites TO service_role;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

SELECT 'RLS temporarily disabled for testing - remember to re-enable with proper policies later!' as warning;