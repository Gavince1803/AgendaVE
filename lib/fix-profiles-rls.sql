-- Update RLS policies for profiles to allow public access to provider and employee profiles

-- Drop existing read policy
DROP POLICY IF EXISTS "profiles_user_read" ON public.profiles;

-- Create new comprehensive read policy
CREATE POLICY "profiles_read_policy" ON public.profiles FOR SELECT USING (
    auth.uid() = id -- User can see their own profile
    OR EXISTS (SELECT 1 FROM public.providers WHERE user_id = profiles.id) -- Public can see providers
    OR EXISTS (SELECT 1 FROM public.employees WHERE profile_id = profiles.id) -- Public can see employees
);

-- Ensure update policy is correct (users can update their own profile)
DROP POLICY IF EXISTS "profiles_user_update" ON public.profiles;
CREATE POLICY "profiles_user_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Ensure insert policy is correct
DROP POLICY IF EXISTS "profiles_user_insert" ON public.profiles;
CREATE POLICY "profiles_user_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
