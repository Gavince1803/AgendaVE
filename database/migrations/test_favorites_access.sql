-- Test script to diagnose user_favorites table issues
-- Run this to see what's causing the 406 error

-- 1. Check if the table exists and its structure
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_favorites' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_favorites' 
AND schemaname = 'public';

-- 3. Check existing policies
SELECT 
    pol.polname as policy_name,
    pol.polcmd as command,
    pol.polqual as using_expression,
    pol.polwithcheck as check_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
WHERE pc.relname = 'user_favorites';

-- 4. Check table permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'user_favorites' 
AND table_schema = 'public';

-- 5. Try a simple insert test (this will show if basic access works)
-- This should work if permissions are correct
SELECT 'Testing access...' as test_status;

-- 6. Check if we can see the current user
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role;