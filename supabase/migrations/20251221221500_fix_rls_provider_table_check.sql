-- Allow providers to insert appointments for themselves, correctly checking the providers table
DROP POLICY IF EXISTS "Users can insert own appointments" ON appointments;
DROP POLICY IF EXISTS "Providers can insert manual appointments" ON appointments;

CREATE POLICY "Providers can insert manual appointments"
ON appointments FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM providers WHERE id = provider_id) OR
  auth.uid() = client_id
);

-- Ensure providers can view their own appointments (already likely covered but reinforcing)
DROP POLICY IF EXISTS "Providers can view own appointments" ON appointments;
CREATE POLICY "Providers can view own appointments"
ON appointments FOR SELECT
USING (
  auth.uid() IN (SELECT user_id FROM providers WHERE id = provider_id) OR
  auth.uid() = client_id
);
