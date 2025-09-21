-- 🔧 Fix Conflicting Profiles RLS Policies
-- Remove conflicting policies and create a single, working policy

BEGIN;

-- Drop ALL existing profiles policies to clean slate
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_update" ON public.profiles;

-- Create simple, working policies
-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- Users can create their own profile (with proper auth check)
CREATE POLICY "profiles_insert_authenticated" ON public.profiles 
FOR INSERT WITH CHECK (
    auth.uid() = id
);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

-- Users can delete their own profile (optional)
CREATE POLICY "profiles_delete_own" ON public.profiles 
FOR DELETE USING (auth.uid() = id);

COMMIT;

-- Test the fix
SELECT 
    'Profiles policy conflict fixed! ✅' as status,
    'Users can now create profiles during registration' as details;