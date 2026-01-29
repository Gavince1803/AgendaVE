-- 1. Add profile_id column to provider_team_members if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'provider_team_members' AND column_name = 'profile_id') THEN
        ALTER TABLE public.provider_team_members ADD COLUMN profile_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Backfill profile_id from employees table (matching by provider and name)
-- This helps link existing Employees to their Public Team Member profile
UPDATE provider_team_members ptm
SET profile_id = e.profile_id
FROM employees e
WHERE e.provider_id = ptm.provider_id
AND lower(trim(ptm.full_name)) = lower(trim(e.name))
AND ptm.profile_id IS NULL
AND e.profile_id IS NOT NULL;

-- 3. Fix RLS Policies for service_employee_pricing (using the new profile_id link)

-- Drop incorrect policies if they exist (cleanup)
DROP POLICY IF EXISTS "Enable insert for authenticated users matching employee_id" ON service_employee_pricing;
DROP POLICY IF EXISTS "Enable update for users matching employee_id" ON service_employee_pricing;
DROP POLICY IF EXISTS "Enable delete for users matching employee_id" ON service_employee_pricing;
DROP POLICY IF EXISTS "Employees can manage their own pricing" ON service_employee_pricing;

-- Create correct policies that check provider_team_members.profile_id
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

-- Ensure providers (owners) can still manage
DROP POLICY IF EXISTS "Providers can manage their team pricing" ON service_employee_pricing;
CREATE POLICY "Providers can manage their team pricing"
  ON service_employee_pricing
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM services s
      JOIN providers p ON s.provider_id = p.id
      WHERE s.id = service_employee_pricing.service_id
      AND p.user_id = auth.uid()
    )
  );

-- 4. Ensure provider_team_members is viewable (should already be public, but just in case)
ALTER TABLE provider_team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team members are viewable by everyone" ON provider_team_members;
CREATE POLICY "Team members are viewable by everyone" ON provider_team_members FOR SELECT USING (true);
