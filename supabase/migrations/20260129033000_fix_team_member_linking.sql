-- 1. Sync profile_id with user_id if user_id exists and profile_id is null
DO $$
BEGIN
    -- Check if user_id column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_team_members' AND column_name = 'user_id') THEN
        -- Copy user_id to profile_id for rows where profile_id is missing
        EXECUTE 'UPDATE provider_team_members SET profile_id = user_id WHERE profile_id IS NULL AND user_id IS NOT NULL';
    END IF;
END $$;

-- 2. Update RLS Policies to use the synced profile_id
DROP POLICY IF EXISTS "Enable insert for linked team members" ON service_employee_pricing;
DROP POLICY IF EXISTS "Enable update for linked team members" ON service_employee_pricing;
DROP POLICY IF EXISTS "Enable delete for linked team members" ON service_employee_pricing;

CREATE POLICY "Enable insert for linked team members"
ON service_employee_pricing
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM provider_team_members ptm
    WHERE ptm.id = service_employee_pricing.employee_id
    AND ptm.profile_id = auth.uid()
  )
);

CREATE POLICY "Enable update for linked team members"
ON service_employee_pricing
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM provider_team_members ptm
    WHERE ptm.id = service_employee_pricing.employee_id
    AND ptm.profile_id = auth.uid()
  )
);

CREATE POLICY "Enable delete for linked team members"
ON service_employee_pricing
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM provider_team_members ptm
    WHERE ptm.id = service_employee_pricing.employee_id
    AND ptm.profile_id = auth.uid()
  )
);

-- 3. Explicitly Grant permissions just in case
GRANT ALL ON service_employee_pricing TO authenticated;
GRANT SELECT ON provider_team_members TO authenticated;
