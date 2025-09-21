-- Test Employee System - Complete Overview

-- 1. See all businesses and their employees
SELECT 'ALL EMPLOYEES BY BUSINESS:' as section;
SELECT 
  COALESCE(p.business_name, p.name) as business,
  e.name as employee,
  e.position,
  e.is_owner,
  e.custom_schedule_enabled,
  e.bio
FROM employees e
JOIN providers p ON p.id = e.provider_id
ORDER BY COALESCE(p.business_name, p.name), e.is_owner DESC, e.name;

-- 2. Test the availability function with real employee IDs
SELECT 'TESTING AVAILABILITY FUNCTION:' as section;

-- Get Juan Carlos availability for Tuesday (day 2)
SELECT 
  'Juan Carlos - Tuesday' as test,
  avail.*
FROM employees e
CROSS JOIN LATERAL get_employee_availability(e.id, 2) as avail
WHERE e.name = 'Juan Carlos';

-- Get Miguel Torres (should use business hours) for Tuesday  
SELECT 
  'Miguel Torres - Tuesday' as test,
  avail.*
FROM employees e
CROSS JOIN LATERAL get_employee_availability(e.id, 2) as avail
WHERE e.name = 'Miguel Torres';

-- Get Dr. Luis Morales for Monday (custom schedule day)
SELECT 
  'Dr. Luis Morales - Monday' as test,
  avail.*
FROM employees e
CROSS JOIN LATERAL get_employee_availability(e.id, 1) as avail
WHERE e.name = 'Dr. Luis Morales';

-- Get Dr. Luis Morales for Tuesday (should be empty - not available)
SELECT 
  'Dr. Luis Morales - Tuesday' as test,
  avail.*
FROM employees e
CROSS JOIN LATERAL get_employee_availability(e.id, 2) as avail
WHERE e.name = 'Dr. Luis Morales';

-- 3. See all services available
SELECT 'ALL SERVICES:' as section;
SELECT 
  COALESCE(p.business_name, p.name) as business,
  s.name as service,
  s.price_amount || ' ' || s.price_currency as price,
  s.duration_minutes || ' minutes' as duration
FROM services s
JOIN providers p ON p.id = s.provider_id
ORDER BY COALESCE(p.business_name, p.name), s.name;

-- 4. Business hours vs Employee hours comparison
SELECT 'SCHEDULE COMPARISON:' as section;
SELECT 
  COALESCE(p.business_name, p.name) as business,
  'Business Hours' as type,
  CASE a.weekday 
    WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday' WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday' WHEN 6 THEN 'Saturday'
  END as day,
  a.start_time || ' - ' || a.end_time as hours
FROM availabilities a
JOIN providers p ON p.id = a.provider_id
WHERE p.id = (SELECT id FROM providers WHERE COALESCE(business_name, name) = 'Elite Barbershop')

UNION ALL

SELECT 
  COALESCE(p.business_name, p.name) as business,
  e.name || ' (Custom)' as type,
  CASE ea.day_of_week 
    WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday' WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday' WHEN 6 THEN 'Saturday'
  END as day,
  ea.start_time || ' - ' || ea.end_time as hours
FROM employee_availabilities ea
JOIN employees e ON e.id = ea.employee_id
JOIN providers p ON p.id = e.provider_id
WHERE p.id = (SELECT id FROM providers WHERE COALESCE(business_name, name) = 'Elite Barbershop')

ORDER BY business, day, type;

-- 5. Ready for booking! Show employee IDs for frontend integration
SELECT 'EMPLOYEE IDs FOR FRONTEND:' as section;
SELECT 
  e.id as employee_id,
  COALESCE(p.business_name, p.name) as business,
  e.name as employee_name,
  e.position,
  e.is_owner,
  e.custom_schedule_enabled
FROM employees e
JOIN providers p ON p.id = e.provider_id
ORDER BY COALESCE(p.business_name, p.name), e.is_owner DESC, e.name;

SELECT 'Employee System Test Complete! 🚀' as status;