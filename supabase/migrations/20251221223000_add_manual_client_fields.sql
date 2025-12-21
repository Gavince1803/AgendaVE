-- Add client_name and client_phone to appointments for better manual booking support
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_phone TEXT;

-- Update RLS again? No, previous RLS covers INSERT.
-- However, we might want to ensure new columns are accessible. 
-- Since RLS is row-based, column access is usually fine unless column security is active (unlikely designated here).
