-- 🔧 Schema Fix for Availabilities Table
-- This script ensures the availabilities table has all required columns
-- Run this on your Supabase database to fix schema cache issues

-- Check current schema and add missing columns if needed
DO $$
BEGIN
  -- Add is_active column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'availabilities' 
    AND column_name = 'is_active' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.availabilities ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added is_active column to availabilities table';
  ELSE
    RAISE NOTICE 'is_active column already exists in availabilities table';
  END IF;

  -- Add start_ts and end_ts columns if they don't exist (for appointment conflicts)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' 
    AND column_name = 'start_ts' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN start_ts TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added start_ts column to appointments table';
  ELSE
    RAISE NOTICE 'start_ts column already exists in appointments table';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' 
    AND column_name = 'end_ts' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN end_ts TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added end_ts column to appointments table';
  ELSE
    RAISE NOTICE 'end_ts column already exists in appointments table';
  END IF;

  -- Add missing fields to providers table if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' 
    AND column_name = 'name' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.providers ADD COLUMN name TEXT;
    RAISE NOTICE 'Added name column to providers table';
  ELSE
    RAISE NOTICE 'name column already exists in providers table';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' 
    AND column_name = 'timezone' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.providers ADD COLUMN timezone TEXT DEFAULT 'America/Caracas';
    RAISE NOTICE 'Added timezone column to providers table';
  ELSE
    RAISE NOTICE 'timezone column already exists in providers table';
  END IF;
END $$;

-- Update existing appointments to have proper timestamps if they're null
UPDATE public.appointments 
SET 
  start_ts = (appointment_date || ' ' || appointment_time)::timestamp,
  end_ts = (appointment_date || ' ' || appointment_time)::timestamp + INTERVAL '1 hour'
WHERE start_ts IS NULL OR end_ts IS NULL;

-- Refresh RLS policies to ensure they work with the updated schema
DROP POLICY IF EXISTS "availabilities_public_read" ON public.availabilities;
CREATE POLICY "availabilities_public_read" ON public.availabilities FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "availabilities_provider_all" ON public.availabilities;
CREATE POLICY "availabilities_provider_all" ON public.availabilities FOR ALL USING (
  EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_availabilities_active ON public.availabilities(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_appointments_timestamps ON public.appointments(start_ts, end_ts);

-- Vacuum and analyze to refresh schema cache
VACUUM ANALYZE public.availabilities;
VACUUM ANALYZE public.appointments;
VACUUM ANALYZE public.providers;

SELECT 'Schema fix completed successfully!' as result;