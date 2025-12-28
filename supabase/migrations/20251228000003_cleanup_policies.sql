-- Remove redundant and potentially buggy policies
-- We are keeping "Providers are viewable by everyone" (USING true) as the source of truth

DROP POLICY IF EXISTS "Public providers are viewable by everyone" ON providers;
DROP POLICY IF EXISTS "Anyone can view providers" ON providers;
DROP POLICY IF EXISTS "providers_public_read" ON providers; -- This used is_admin() which might be causing issues

-- Ensure our reliable policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'providers' 
    AND policyname = 'Providers are viewable by everyone'
  ) THEN
    CREATE POLICY "Providers are viewable by everyone" 
    ON providers FOR SELECT 
    USING (true);
  END IF;
END $$;
