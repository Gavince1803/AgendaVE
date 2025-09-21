-- Employee System Diagnostic Script
-- This will help us understand what's happening

-- 1. Check if employees table exists and its structure
SELECT 'Checking employees table structure:' as info;
\d employees;

-- 2. Count employees
SELECT 'Total employees in database:' as info;
SELECT COUNT(*) as employee_count FROM employees;

-- 3. Check if we have any providers
SELECT 'Checking providers:' as info;
SELECT COUNT(*) as provider_count FROM providers;
SELECT id, business_name, is_active FROM providers LIMIT 5;

-- 4. Check for any employees (should show auto-created owner employees)
SELECT 'Current employees (if any):' as info;
SELECT 
  e.id,
  e.provider_id,
  e.name,
  e.position,
  e.is_owner,
  e.is_active,
  p.business_name as provider_business
FROM employees e
LEFT JOIN providers p ON p.id = e.provider_id
ORDER BY e.created_at;

-- 5. Check employee availabilities
SELECT 'Employee availabilities:' as info;
SELECT COUNT(*) as availability_count FROM employee_availabilities;

-- 6. Test if the trigger function exists
SELECT 'Checking if trigger function exists:' as info;
SELECT proname FROM pg_proc WHERE proname = 'create_owner_employee';

-- 7. Check if trigger exists
SELECT 'Checking triggers on providers table:' as info;
SELECT 
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgrelid = 'providers'::regclass;

-- 8. Manually check what happens when we try to create an employee
SELECT 'Testing manual employee creation:' as info;
DO $$
DECLARE
  test_provider_id uuid;
BEGIN
  -- Get first provider
  SELECT id INTO test_provider_id FROM providers WHERE is_active = true LIMIT 1;
  
  IF test_provider_id IS NOT NULL THEN
    -- Try to insert a test employee
    BEGIN
      INSERT INTO employees (provider_id, name, position, is_owner, is_active, custom_schedule_enabled)
      VALUES (test_provider_id, 'Test Employee', 'Test Position', false, true, false);
      
      RAISE NOTICE 'Successfully created test employee for provider %', test_provider_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error creating employee: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'No providers found to test with';
  END IF;
END $$;

-- 9. Check the result
SELECT 'Final employee count:' as info;
SELECT COUNT(*) as final_count FROM employees;

SELECT 'Diagnostic completed!' as status;