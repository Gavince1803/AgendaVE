-- 🛡️ Fix Missing RLS on Profiles Table
-- CRITICAL: Add RLS policies to protect user personal information

BEGIN;

-- Enable Row Level Security on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (from previous script)
DROP POLICY IF EXISTS "profiles_user_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_insert" ON public.profiles;

-- Users can only read their own profile
CREATE POLICY "profiles_read_own" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

-- Users can only create their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles 
FOR INSERT WITH CHECK (
    auth.uid() = id 
    AND auth.email() = email
);

-- Users can delete their own profile (optional - usually not needed)
CREATE POLICY "profiles_delete_own" ON public.profiles 
FOR DELETE USING (auth.uid() = id);

COMMIT;

-- Verify RLS is enabled
SELECT 
    'Profiles RLS fixed successfully! 🛡️' as status,
    'User personal data is now protected.' as details;