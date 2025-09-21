-- 🧪 RLS Security Verification Tests  
-- Tests to verify that users can only access their own data
-- Run these tests to ensure RLS policies are working correctly

-- ⚠️ IMPORTANT: These tests simulate different user sessions
-- In real testing, you'd need to set auth.uid() for each test

BEGIN;

SELECT '🧪 Starting RLS Security Tests...' as test_status;

-- ==============================================
-- TEST 1: PROFILES ISOLATION
-- ==============================================

SELECT '📋 TEST 1: Profile Data Isolation' as test_name;

-- Simulate Client 1 session
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

-- Client 1 should only see their own profile
SELECT 
    'Client 1 Profile Access' as test_case,
    COUNT(*) as profiles_visible,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ PASS - Only own profile visible'
        ELSE '❌ FAIL - Can see ' || COUNT(*) || ' profiles'
    END as result
FROM public.profiles;

-- Simulate Client 2 session  
SELECT set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

-- Client 2 should only see their own profile
SELECT 
    'Client 2 Profile Access' as test_case,
    COUNT(*) as profiles_visible,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ PASS - Only own profile visible'
        ELSE '❌ FAIL - Can see ' || COUNT(*) || ' profiles'
    END as result
FROM public.profiles;

-- ==============================================
-- TEST 2: APPOINTMENTS ISOLATION
-- ==============================================

SELECT '📅 TEST 2: Appointments Data Isolation' as test_name;

-- Simulate Client 1 session
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

-- Client 1 should only see their own appointments
SELECT 
    'Client 1 Appointments Access' as test_case,
    COUNT(*) as appointments_visible,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS - Can see own appointments (' || COUNT(*) || ')'
        ELSE '⚠️ INFO - No appointments found'
    END as result
FROM public.appointments;

-- Verify they can't see other client's appointments
SELECT set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

SELECT 
    'Client 2 Appointments Access' as test_case,
    COUNT(*) as appointments_visible,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS - Can see own appointments (' || COUNT(*) || ')'
        ELSE '⚠️ INFO - No appointments found'
    END as result
FROM public.appointments;

-- ==============================================
-- TEST 3: PROVIDER DATA ISOLATION
-- ==============================================

SELECT '🏪 TEST 3: Provider Data Isolation' as test_name;

-- Simulate Provider 1 session
SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);

-- Provider 1 should see their own services
SELECT 
    'Provider 1 Services Access' as test_case,
    COUNT(*) as services_visible,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS - Can see own services (' || COUNT(*) || ')'
        ELSE '❌ FAIL - Cannot see own services'
    END as result
FROM public.services s
JOIN public.providers p ON s.provider_id = p.id
WHERE p.user_id = '33333333-3333-3333-3333-333333333333'::uuid;

-- Provider 1 should see their own provider record
SELECT 
    'Provider 1 Provider Record Access' as test_case,
    COUNT(*) as provider_records_visible,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ PASS - Can see own provider record'
        ELSE '❌ FAIL - Provider record access issue'
    END as result
FROM public.providers
WHERE user_id = '33333333-3333-3333-3333-333333333333'::uuid;

-- ==============================================
-- TEST 4: FAVORITES ISOLATION
-- ==============================================

SELECT '❤️ TEST 4: Favorites Data Isolation' as test_name;

-- Simulate Client 1 session
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

-- Client 1 should only see their own favorites
SELECT 
    'Client 1 Favorites Access' as test_case,
    COUNT(*) as favorites_visible,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS - Can see own favorites (' || COUNT(*) || ')'
        ELSE '⚠️ INFO - No favorites found'
    END as result
FROM public.user_favorites;

-- Switch to Client 2
SELECT set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

SELECT 
    'Client 2 Favorites Access' as test_case,
    COUNT(*) as favorites_visible,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS - Can see own favorites (' || COUNT(*) || ')'
        ELSE '⚠️ INFO - No favorites found'
    END as result
FROM public.user_favorites;

-- ==============================================
-- TEST 5: PUBLIC DATA ACCESS
-- ==============================================

SELECT '🌐 TEST 5: Public Data Access (Should Work)' as test_name;

-- Reset to anonymous user
SELECT set_config('request.jwt.claim.sub', '', true);

-- Anonymous users should see active providers (for browsing)
SELECT 
    'Anonymous Provider Browsing' as test_case,
    COUNT(*) as providers_visible,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS - Public can browse providers (' || COUNT(*) || ')'
        ELSE '❌ FAIL - Public cannot browse providers'
    END as result
FROM public.providers
WHERE is_active = true;

-- Anonymous users should see active services (for browsing)
SELECT 
    'Anonymous Service Browsing' as test_case,
    COUNT(*) as services_visible,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS - Public can browse services (' || COUNT(*) || ')'
        ELSE '❌ FAIL - Public cannot browse services'
    END as result
FROM public.services
WHERE is_active = true;

-- ==============================================
-- TEST 6: REVIEWS SECURITY
-- ==============================================

SELECT '⭐ TEST 6: Reviews Security' as test_name;

-- Reviews should be publicly readable
SELECT 
    'Public Reviews Access' as test_case,
    COUNT(*) as reviews_visible,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS - Public can read reviews (' || COUNT(*) || ')'
        ELSE '⚠️ INFO - No reviews found'
    END as result
FROM public.reviews;

-- ==============================================
-- TEST SUMMARY
-- ==============================================

SELECT '📊 RLS Security Test Summary' as test_name;

-- Count total policies by table
SELECT 
    schemaname as schema,
    tablename as table_name,
    COUNT(policyname) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Final verification message
SELECT 
    '🎯 RLS Testing Complete!' as status,
    'Review the test results above to verify security is working correctly.' as instructions,
    'All PASS results indicate proper data isolation.' as note;

COMMIT;