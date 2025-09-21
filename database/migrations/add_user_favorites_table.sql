-- Create user_favorites table for storing user's favorite providers
-- This table tracks which providers each user has marked as favorites

CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure a user can't favorite the same provider twice
    UNIQUE(user_id, provider_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_provider_id ON public.user_favorites(provider_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON public.user_favorites(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_favorites table

-- Users can only read their own favorites
CREATE POLICY "Users can view their own favorites" 
ON public.user_favorites FOR SELECT 
USING (auth.uid() = user_id);

-- Users can only insert their own favorites
CREATE POLICY "Users can add their own favorites" 
ON public.user_favorites FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own favorites
CREATE POLICY "Users can remove their own favorites" 
ON public.user_favorites FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_favorites_updated_at 
    BEFORE UPDATE ON public.user_favorites 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.user_favorites TO authenticated;
GRANT ALL ON public.user_favorites TO service_role;

-- Insert some example favorites data for testing (optional)
-- You can remove this section if you don't want test data
/*
DO $$
BEGIN
    -- Only insert if there are existing users and providers
    IF EXISTS (SELECT 1 FROM auth.users LIMIT 1) AND EXISTS (SELECT 1 FROM public.providers LIMIT 1) THEN
        -- Insert a few example favorites (modify user_id and provider_id as needed)
        INSERT INTO public.user_favorites (user_id, provider_id) 
        SELECT 
            u.id as user_id,
            p.id as provider_id
        FROM 
            (SELECT id FROM auth.users WHERE email LIKE '%@%' LIMIT 1) u,
            (SELECT id FROM public.providers ORDER BY created_at LIMIT 2) p
        ON CONFLICT (user_id, provider_id) DO NOTHING;
    END IF;
END $$;
*/