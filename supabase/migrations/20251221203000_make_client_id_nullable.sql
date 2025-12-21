-- Make client_id nullable to support manual bookings by providers (e.g. phone bookings)
ALTER TABLE public.appointments ALTER COLUMN client_id DROP NOT NULL;

-- Update RLS policies might be needed if they rely on client_id
-- But existing policies usually check "auth.uid() = client_id OR auth.uid() IN (SELECT user_id FROM providers...)"
-- So if client_id is NULL, the client part fails but provider part should still see it.
