-- Simplest possible user_favorites table setup
-- This removes all complexity and just creates a basic accessible table

-- Drop the table if it exists and recreate it simply
DROP TABLE IF EXISTS public.user_favorites CASCADE;

-- Create the table with minimal constraints
CREATE TABLE public.user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add a simple unique constraint
CREATE UNIQUE INDEX user_favorites_unique_idx ON public.user_favorites (user_id, provider_id);

-- Disable ALL security for testing
ALTER TABLE public.user_favorites DISABLE ROW LEVEL SECURITY;

-- Grant maximum permissions
GRANT ALL PRIVILEGES ON public.user_favorites TO PUBLIC;
GRANT ALL PRIVILEGES ON public.user_favorites TO authenticated;
GRANT ALL PRIVILEGES ON public.user_favorites TO service_role;
GRANT ALL PRIVILEGES ON public.user_favorites TO anon;

-- Test that it works
INSERT INTO public.user_favorites (user_id, provider_id) 
SELECT 
    '831d709a-cc01-42cd-a3e6-8e2f2feb4946'::uuid as user_id,
    '7afa16cf-de62-4cb1-949b-21856859ee3c'::uuid as provider_id
WHERE EXISTS (
    SELECT 1 FROM auth.users WHERE id = '831d709a-cc01-42cd-a3e6-8e2f2feb4946'::uuid
)
ON CONFLICT (user_id, provider_id) DO NOTHING;

-- Show the result
SELECT 'Simple user_favorites table created successfully!' as status;
SELECT count(*) as test_records FROM public.user_favorites;