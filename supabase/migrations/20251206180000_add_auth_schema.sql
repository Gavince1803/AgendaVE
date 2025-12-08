-- Create user_identifiers table
CREATE TABLE IF NOT EXISTS public.user_identifiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cedula TEXT UNIQUE,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_identifiers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own identifiers"
ON public.user_identifiers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own identifiers"
ON public.user_identifiers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own identifiers"
ON public.user_identifiers FOR UPDATE
USING (auth.uid() = user_id);

-- Create get_email_by_identifier function
CREATE OR REPLACE FUNCTION public.get_email_by_identifier(identifier_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    found_email TEXT;
    clean_identifier TEXT;
BEGIN
    clean_identifier := identifier_input;

    -- 1. Buscar por Cédula
    SELECT email INTO found_email
    FROM public.user_identifiers
    WHERE cedula = clean_identifier;

    IF found_email IS NOT NULL THEN
        RETURN found_email;
    END IF;

    -- 2. Buscar por Teléfono
    SELECT email INTO found_email
    FROM public.user_identifiers
    WHERE phone = clean_identifier;

    IF found_email IS NOT NULL THEN
        RETURN found_email;
    END IF;

    RETURN NULL;
END;
$$;
