-- 🔍 Security Verification Script
-- Check that all tables have proper RLS protection

-- Check which tables have RLS enabled
SELECT 
    schemaname as schema,
    tablename as table_name,
    rowsecurity as rls_enabled
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public' 
AND tablename NOT LIKE '%_old%'
ORDER BY tablename;

-- Check RLS policies on each table
SELECT 
    schemaname as schema,
    tablename as table_name,
    policyname as policy_name,
    cmd as command_type,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Summary message
SELECT 
    'Security verification completed! 🛡️' as status,
    'Check the results above to confirm all tables have RLS enabled' as details;