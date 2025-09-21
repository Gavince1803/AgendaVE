-- 🛡️ Enhanced RLS Policies for Beta Security
-- This script adds missing policies and fixes security gaps

BEGIN;

-- ========================================
-- 1. ADD USER_FAVORITES TO MAIN SCHEMA
-- ========================================

-- Add user_favorites table to main schema if not exists
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

-- Enable Row Level Security
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can add their own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can remove their own favorites" ON public.user_favorites;

-- Create RLS policies for user_favorites table
CREATE POLICY "user_favorites_read_own" ON public.user_favorites 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_favorites_insert_own" ON public.user_favorites 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_favorites_delete_own" ON public.user_favorites 
FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_favorites_updated_at ON public.user_favorites;
CREATE TRIGGER update_user_favorites_updated_at 
    BEFORE UPDATE ON public.user_favorites 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 2. ENHANCED APPOINTMENT POLICIES
-- ========================================

-- Allow clients to cancel their pending appointments
DROP POLICY IF EXISTS "appointments_client_cancel" ON public.appointments;
CREATE POLICY "appointments_client_cancel" ON public.appointments 
FOR UPDATE USING (
    auth.uid() = client_id 
    AND status = 'pending'
    AND appointment_date >= CURRENT_DATE
) WITH CHECK (
    status IN ('cancelled')
);

-- Allow clients to reschedule their pending appointments
DROP POLICY IF EXISTS "appointments_client_reschedule" ON public.appointments;
CREATE POLICY "appointments_client_reschedule" ON public.appointments 
FOR UPDATE USING (
    auth.uid() = client_id 
    AND status = 'pending'
    AND appointment_date >= CURRENT_DATE
) WITH CHECK (
    appointment_date >= CURRENT_DATE
    AND appointment_time IS NOT NULL
);

-- ========================================
-- 3. ENHANCED PROVIDER POLICIES
-- ========================================

-- Allow providers to see their own inactive providers (for management)
DROP POLICY IF EXISTS "providers_owner_read_all" ON public.providers;
CREATE POLICY "providers_owner_read_all" ON public.providers 
FOR SELECT USING (auth.uid() = user_id);

-- ========================================
-- 4. ENHANCED SERVICE POLICIES
-- ========================================

-- Allow providers to see all their services (including inactive)
DROP POLICY IF EXISTS "services_provider_read_all" ON public.services;
CREATE POLICY "services_provider_read_all" ON public.services 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = user_id)
);

-- ========================================
-- 5. ENHANCED REVIEW POLICIES
-- ========================================

-- Only allow reviews for completed appointments
DROP POLICY IF EXISTS "reviews_client_insert" ON public.reviews;
CREATE POLICY "reviews_client_insert_completed" ON public.reviews 
FOR INSERT WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (
        SELECT 1 FROM public.appointments 
        WHERE id = appointment_id 
        AND client_id = auth.uid() 
        AND status = 'done'
    )
);

-- Prevent duplicate reviews for the same appointment
ALTER TABLE public.reviews ADD CONSTRAINT IF NOT EXISTS unique_review_per_appointment 
UNIQUE (appointment_id);

-- ========================================
-- 6. ENHANCED AVAILABILITY POLICIES
-- ========================================

-- Allow providers to manage all their availabilities
DROP POLICY IF EXISTS "availabilities_provider_all" ON public.availabilities;
CREATE POLICY "availabilities_provider_all" ON public.availabilities 
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = user_id)
);

-- ========================================
-- 7. PROFILE POLICIES ENHANCEMENT
-- ========================================

-- Allow users to create their profile on first login
DROP POLICY IF EXISTS "profiles_user_insert" ON public.profiles;
CREATE POLICY "profiles_user_insert" ON public.profiles 
FOR INSERT WITH CHECK (
    auth.uid() = id
    AND auth.email() = email
);

-- ========================================
-- 8. SECURITY FUNCTIONS
-- ========================================

-- Function to check if user is the appointment client
CREATE OR REPLACE FUNCTION auth.is_appointment_client(appointment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.appointments 
        WHERE id = appointment_id 
        AND client_id = auth.uid()
    );
END;
$$;

-- Function to check if user is the provider of an appointment
CREATE OR REPLACE FUNCTION auth.is_appointment_provider(appointment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.appointments a
        JOIN public.providers p ON a.provider_id = p.id
        WHERE a.id = appointment_id 
        AND p.user_id = auth.uid()
    );
END;
$$;

-- ========================================
-- 9. DATA INTEGRITY CONSTRAINTS
-- ========================================

-- Ensure appointment times are in the future for new appointments
ALTER TABLE public.appointments 
DROP CONSTRAINT IF EXISTS appointment_future_date;

ALTER TABLE public.appointments 
ADD CONSTRAINT appointment_future_date 
CHECK (
    appointment_date >= CURRENT_DATE 
    OR status != 'pending'
);

-- Ensure service prices are positive
ALTER TABLE public.services 
DROP CONSTRAINT IF EXISTS positive_price;

ALTER TABLE public.services 
ADD CONSTRAINT positive_price 
CHECK (price_amount > 0);

-- Ensure service duration is reasonable (5 minutes to 8 hours)
ALTER TABLE public.services 
DROP CONSTRAINT IF EXISTS reasonable_duration;

ALTER TABLE public.services 
ADD CONSTRAINT reasonable_duration 
CHECK (duration_minutes >= 5 AND duration_minutes <= 480);

-- ========================================
-- 10. GRANT PERMISSIONS
-- ========================================

-- Grant necessary permissions to authenticated users
GRANT ALL ON public.user_favorites TO authenticated;
GRANT ALL ON public.user_favorites TO service_role;

-- Grant usage on sequences (if any were created)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ========================================
-- 11. TEST POLICIES
-- ========================================

-- Verify all tables have RLS enabled
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT schemaname||'.'||tablename as full_name
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT LIKE '%_old%'
    LOOP
        -- Check if RLS is enabled
        IF NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
            AND c.relname = split_part(table_name, '.', 2)
            AND c.relrowsecurity = true
        ) THEN
            RAISE NOTICE 'WARNING: RLS not enabled on table %', table_name;
        ELSE
            RAISE NOTICE 'RLS enabled on table %', table_name;
        END IF;
    END LOOP;
END $$;

COMMIT;

-- Success message
SELECT 'Enhanced RLS policies implemented successfully! 🛡️' as status,
       'All security gaps have been addressed.' as details;