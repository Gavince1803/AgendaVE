-- Fix RLS policies for employee_availabilities table
-- This script addresses the 403 Forbidden errors when saving employee schedules

-- 1. Drop existing policies if they exist
DROP POLICY IF EXISTS "Providers can manage employee availabilities" ON employee_availabilities;
DROP POLICY IF EXISTS "Clients can view employee availabilities" ON employee_availabilities;
DROP POLICY IF EXISTS "Anyone can view employee availabilities" ON employee_availabilities;

-- 2. Create proper RLS policies for employee_availabilities

-- Allow providers to manage availabilities for their employees
CREATE POLICY "Providers can manage employee availabilities" ON employee_availabilities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN providers p ON p.id = e.provider_id
      WHERE e.id = employee_availabilities.employee_id
      AND p.user_id = auth.uid()
    )
  );

-- Allow clients to view employee availabilities for booking purposes
CREATE POLICY "Clients can view employee availabilities" ON employee_availabilities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = employee_availabilities.employee_id
      AND e.is_active = true
    )
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'client'
    )
  );

-- Allow anonymous users to view employee availabilities (for browsing)
CREATE POLICY "Anyone can view employee availabilities" ON employee_availabilities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = employee_availabilities.employee_id
      AND e.is_active = true
    )
  );

-- 3. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON employee_availabilities TO authenticated;
GRANT SELECT ON employee_availabilities TO anon;

-- 4. Test the RLS function works correctly
-- This ensures the get_employee_availability function can access the data
GRANT EXECUTE ON FUNCTION get_employee_availability TO authenticated;
GRANT EXECUTE ON FUNCTION get_employee_availability TO anon;

-- 5. Optional: Test query to verify RLS works
-- SELECT 'RLS Test Complete - employee_availabilities policies updated' as status;