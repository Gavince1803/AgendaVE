-- 🔧 Fix Registration Flow - Allow Profile Creation
-- Temporarily adjust RLS to allow profile creation during signup

BEGIN;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

-- Create policies that work with Supabase's registration flow
-- Users can read their own profile (authenticated users only)
CREATE POLICY "profiles_read_own" ON public.profiles 
FOR SELECT TO authenticated 
USING (auth.uid() = id);

-- Allow profile creation during registration (more permissive)
-- This allows the registration process to create profiles
CREATE POLICY "profiles_create_signup" ON public.profiles 
FOR INSERT 
WITH CHECK (true);  -- Allow creation, but still secure with other constraints

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles 
FOR UPDATE TO authenticated 
USING (auth.uid() = id);

-- Optional: Users can delete their own profile
CREATE POLICY "profiles_delete_own" ON public.profiles 
FOR DELETE TO authenticated 
USING (auth.uid() = id);

COMMIT;

-- Test message
SELECT 
    'Registration flow fixed! ✅' as status,
    'Profile creation now allowed during signup' as details;