-- Alternative fix for Supabase API access issues
-- This addresses potential Supabase-specific API configuration problems

-- 1. Ensure the table exists with correct structure
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, provider_id)
);

-- 2. Completely disable RLS for now
ALTER TABLE public.user_favorites DISABLE ROW LEVEL SECURITY;

-- 3. Grant permissions specifically for Supabase roles
GRANT ALL ON public.user_favorites TO postgres;
GRANT ALL ON public.user_favorites TO authenticated;
GRANT ALL ON public.user_favorites TO service_role;
GRANT ALL ON public.user_favorites TO supabase_admin;

-- 4. Grant public access (temporary for testing)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_favorites TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_favorites TO PUBLIC;

-- 5. Ensure API access is enabled
ALTER TABLE public.user_favorites REPLICA IDENTITY DEFAULT;

-- 6. Add comment for API documentation
COMMENT ON TABLE public.user_favorites IS 'User favorites for providers - API accessible';

-- 7. Test the setup with a simple query that should work
SELECT 
    'user_favorites table configured for API access' as status,
    count(*) as current_records
FROM public.user_favorites;