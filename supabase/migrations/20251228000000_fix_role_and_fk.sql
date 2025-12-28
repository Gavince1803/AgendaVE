-- 1. FIX REVIEWS FOREIGN KEY (CRITICAL FIX)
-- This fixes the crash in the Reviews tab/list
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'reviews_client_id_fkey'
  ) THEN
    ALTER TABLE reviews
    ADD CONSTRAINT reviews_client_id_fkey
    FOREIGN KEY (client_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- 2. DIAGNOSTIC: PROFILES CHECK
-- Run this to see who is actually registered as a provider in your database.
SELECT id, email, full_name, role 
FROM profiles 
WHERE role = 'provider';

-- 3. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload config';
