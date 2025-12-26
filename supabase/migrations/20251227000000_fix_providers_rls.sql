-- Enable RLS on providers table
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Allow public read access to providers (needed for search, listings)
DROP POLICY IF EXISTS "Public providers are viewable by everyone" ON public.providers;
CREATE POLICY "Public providers are viewable by everyone"
ON public.providers FOR SELECT
USING (true);

-- Allow users to insert their own provider profile
-- This is critical for the registration flow
DROP POLICY IF EXISTS "Users can insert their own provider profile" ON public.providers;
CREATE POLICY "Users can insert their own provider profile"
ON public.providers FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own provider profile
DROP POLICY IF EXISTS "Users can update their own provider profile" ON public.providers;
CREATE POLICY "Users can update their own provider profile"
ON public.providers FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to delete their own provider profile
DROP POLICY IF EXISTS "Users can delete their own provider profile" ON public.providers;
CREATE POLICY "Users can delete their own provider profile"
ON public.providers FOR DELETE
USING (auth.uid() = user_id);
