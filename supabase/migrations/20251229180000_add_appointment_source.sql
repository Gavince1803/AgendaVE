-- Create enum type for appointment source if it doesn't exist
DO $$ BEGIN
    CREATE TYPE appointment_source AS ENUM ('app', 'whatsapp', 'instagram', 'phone', 'walk_in', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add source column to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS source appointment_source DEFAULT 'app';

-- Add index on client_phone to speed up lookups during manual entry
CREATE INDEX IF NOT EXISTS idx_appointments_client_phone ON appointments(client_phone);

-- Also add index on profiles phone for better user lookup
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
