-- Allow providers to insert appointments for themselves, even if client_id is null
DROP POLICY IF EXISTS "Users can insert own appointments" ON appointments;
DROP POLICY IF EXISTS "Providers can insert manual appointments" ON appointments;

CREATE POLICY "Users can insert own appointments"
ON appointments FOR INSERT
WITH CHECK (
  auth.uid() = client_id OR 
  auth.uid() = provider_id
);

-- Ensure providers can view their own appointments including manual ones
DROP POLICY IF EXISTS "Providers can view own appointments" ON appointments;
CREATE POLICY "Providers can view own appointments"
ON appointments FOR SELECT
USING (auth.uid() = provider_id);
