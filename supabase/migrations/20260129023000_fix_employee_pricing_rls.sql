-- 1. Add price_max column to service_employee_pricing if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_employee_pricing' AND column_name = 'price_max') THEN
        ALTER TABLE public.service_employee_pricing ADD COLUMN price_max DECIMAL(10, 2);
    END IF;
END $$;

-- 2. Fix RLS Policies for service_employee_pricing

-- Drop existing restricted policy if it exists (to replace it with a broader one)
DROP POLICY IF EXISTS "Providers can manage their own employee pricing" ON service_employee_pricing;

-- Create new policies
-- Allow employees to INSERT/UPDATE/DELETE their own pricing rows
-- Re-defining the policy to be safe and allow the user to manage rows where employee_id is their own ID.
-- We verify this by joining with provider_team_members on profile_id.
  
-- Re-defining the policy to be safe and allow the user to manage rows where employee_id is their own ID.
-- We must check if the linked provider_team_members record belongs to the auth user.
CREATE POLICY "Enable insert for authenticated users matching employee_id"
ON service_employee_pricing
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM provider_team_members ptm
    WHERE ptm.id = service_employee_pricing.employee_id
    AND ptm.profile_id = auth.uid()
  )
);

CREATE POLICY "Enable update for users matching employee_id"
ON service_employee_pricing
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM provider_team_members ptm
    WHERE ptm.id = service_employee_pricing.employee_id
    AND ptm.profile_id = auth.uid()
  )
);

CREATE POLICY "Enable delete for users matching employee_id"
ON service_employee_pricing
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM provider_team_members ptm
    WHERE ptm.id = service_employee_pricing.employee_id
    AND ptm.profile_id = auth.uid()
  )
);

-- Also keep the provider access (so business owners can manage too)
CREATE POLICY "Providers can manage their team pricing"
  ON service_employee_pricing
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM services s
      WHERE s.id = service_employee_pricing.service_id
      AND s.provider_id = (SELECT id FROM providers WHERE user_id = auth.uid()) 
      -- Assuming providers table links user_id
    )
  );
