-- Create a table to store user identifiers (Cedula, Phone) securely
CREATE TABLE IF NOT EXISTS public.user_identifiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cedula TEXT UNIQUE, -- Storing plain text for now, but strictly protected by RLS and RPC
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_identifiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own identifiers
CREATE POLICY "Users can read own identifiers"
ON public.user_identifiers
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own identifiers (during registration)
CREATE POLICY "Users can insert own identifiers"
ON public.user_identifiers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own identifiers
CREATE POLICY "Users can update own identifiers"
ON public.user_identifiers
FOR UPDATE
USING (auth.uid() = user_id);

-- Secure RPC function to look up email by Cedula
-- This function runs with SECURITY DEFINER to bypass RLS and look up the email
CREATE OR REPLACE FUNCTION public.get_email_by_cedula(cedula_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    found_email TEXT;
    found_user_id UUID;
BEGIN
    -- Find the user_id associated with the cedula
    SELECT user_id INTO found_user_id
    FROM public.user_identifiers
    WHERE cedula = cedula_input;

    IF found_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Find the email from auth.users (requires access to auth schema, might need adjustment)
    -- Direct access to auth.users is often restricted even for SECURITY DEFINER functions in some Supabase setups
    -- unless the function owner has permissions.
    -- Alternative: We can store the email in user_identifiers as a cache, or query a public profile if it has email.
    
    -- Let's try querying auth.users directly. If this fails, we might need to store email in user_identifiers.
    SELECT email INTO found_email
    FROM auth.users
    WHERE id = found_user_id;

    RETURN found_email;
END;
$$;

-- Alternative RPC: If direct auth.users access is tricky, let's rely on the profile or a join
-- But for now, let's assume we can query auth.users or we store email in the identifiers table for simplicity.
-- Let's update the table to store email as well to avoid permission issues with auth schema.

ALTER TABLE public.user_identifiers ADD COLUMN IF NOT EXISTS email TEXT;

-- Update the function to use the local email column
CREATE OR REPLACE FUNCTION public.get_email_by_cedula(cedula_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    found_email TEXT;
BEGIN
    SELECT email INTO found_email
    FROM public.user_identifiers
    WHERE cedula = cedula_input;

    RETURN found_email;
END;
$$;
