-- Demo Data for Employee System
-- This creates sample data to demonstrate the new employee functionality

-- First, let's see what we have now
SELECT 'Current Employees (Auto-created from existing providers):' as info;
SELECT 
  p.business_name as business,
  e.name as employee_name,
  e.position,
  e.is_owner,
  e.is_active,
  e.custom_schedule_enabled
FROM employees e
JOIN providers p ON p.id = e.provider_id
ORDER BY p.business_name, e.name;

-- Now let's add some additional employees to existing providers
-- (This assumes you have at least one provider - if not, we'll create one)

-- Add employees to the first provider (assuming it exists)
DO $$
DECLARE
  first_provider_id uuid;
  provider_name text;
BEGIN
  -- Get the first active provider
  SELECT id, business_name INTO first_provider_id, provider_name
  FROM providers 
  WHERE is_active = true 
  LIMIT 1;
  
  IF first_provider_id IS NOT NULL THEN
    -- Add a senior employee
    INSERT INTO employees (provider_id, name, position, is_active, is_owner, custom_schedule_enabled, bio)
    VALUES (
      first_provider_id,
      'María García',
      'Senior Stylist',
      true,
      false,
      false,
      'Experienced stylist with 8 years in the beauty industry'
    );
    
    -- Add a junior employee with custom schedule
    INSERT INTO employees (provider_id, name, position, is_active, is_owner, custom_schedule_enabled, bio)
    VALUES (
      first_provider_id,
      'Carlos Mendoza',
      'Junior Barber',
      true,
      false,
      true,
      'Part-time barber, available afternoons and weekends'
    );
    
    -- Get the junior employee ID for custom schedule
    DECLARE
      junior_employee_id uuid;
    BEGIN
      SELECT id INTO junior_employee_id
      FROM employees 
      WHERE provider_id = first_provider_id 
      AND name = 'Carlos Mendoza';
      
      -- Add custom schedule for Carlos (afternoons only, Tue-Sat)
      INSERT INTO employee_availabilities (employee_id, day_of_week, start_time, end_time, is_available)
      VALUES 
        (junior_employee_id, 2, '14:00', '19:00', true), -- Tuesday
        (junior_employee_id, 3, '14:00', '19:00', true), -- Wednesday
        (junior_employee_id, 4, '14:00', '19:00', true), -- Thursday
        (junior_employee_id, 5, '14:00', '19:00', true), -- Friday
        (junior_employee_id, 6, '10:00', '18:00', true); -- Saturday
    END;
    
    RAISE NOTICE 'Added 2 employees to provider: %', provider_name;
  ELSE
    RAISE NOTICE 'No active providers found. Please create a provider first.';
  END IF;
END $$;

-- Show the updated employee list
SELECT 'Updated Employee List:' as info;
SELECT 
  p.business_name as business,
  e.name as employee_name,
  e.position,
  e.is_owner,
  e.custom_schedule_enabled,
  e.bio
FROM employees e
JOIN providers p ON p.id = e.provider_id
ORDER BY p.business_name, e.is_owner DESC, e.name;

-- Show custom schedules
SELECT 'Employees with Custom Schedules:' as info;
SELECT 
  p.business_name as business,
  e.name as employee_name,
  e.position,
  CASE ea.day_of_week 
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END as day,
  ea.start_time,
  ea.end_time
FROM employee_availabilities ea
JOIN employees e ON e.id = ea.employee_id
JOIN providers p ON p.id = e.provider_id
ORDER BY p.business_name, e.name, ea.day_of_week;

-- Test the availability function
SELECT 'Testing Employee Availability Function:' as info;

-- Test for Tuesday (day 2)
SELECT 
  e.name as employee_name,
  'Tuesday' as day,
  avail.*
FROM employees e
CROSS JOIN LATERAL get_employee_availability(e.id, 2) as avail
WHERE e.name IN ('María García', 'Carlos Mendoza')
ORDER BY e.name;

SELECT 'Employee System Demo Data Created Successfully!' as status;