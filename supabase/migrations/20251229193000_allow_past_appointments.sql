-- Drop the constraint that prevents past appointments
-- This is necessary to allow importing historical data from Excel
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointment_future_date;

-- Optionally, we could re-add it as a trigger that only checks on interactive inserts, 
-- but for now, simple removal allows the import feature to work as expected.
