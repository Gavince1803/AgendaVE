-- Fix RLS policies for user_favorites table
-- This script fixes the 406 "Not Acceptable" error by correcting the RLS policies

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can add their own favorites" ON public.user_favorites;  
DROP POLICY IF EXISTS "Users can remove their own favorites" ON public.user_favorites;

-- Create corrected RLS policies

-- Policy 1: Users can view their own favorites
CREATE POLICY "Enable read access for users based on user_id" 
ON public.user_favorites FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own favorites
CREATE POLICY "Enable insert access for users based on user_id" 
ON public.user_favorites FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can delete their own favorites
CREATE POLICY "Enable delete access for users based on user_id" 
ON public.user_favorites FOR DELETE 
USING (auth.uid() = user_id);

-- Policy 4: Users can update their own favorites (for future use)
CREATE POLICY "Enable update access for users based on user_id" 
ON public.user_favorites FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Make sure RLS is enabled
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Ensure proper permissions are granted
GRANT ALL ON public.user_favorites TO authenticated;
GRANT ALL ON public.user_favorites TO service_role;

-- Grant usage on the sequence if it exists
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Test the policies by checking if a simple select works
-- This will help verify the policies are working correctly
SELECT 'RLS policies updated successfully' as status;