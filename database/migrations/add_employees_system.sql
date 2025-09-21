-- Migration: Add Employee System
-- This adds the ability for businesses to have multiple employees
-- with individual schedules and appointment assignments

-- 1. Create employees table
CREATE TABLE public.employees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  name text NOT NULL,
  email text NULL,
  phone text NULL,
  position text NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_owner boolean NOT NULL DEFAULT false,
  profile_image_url text NULL,
  custom_schedule_enabled boolean NOT NULL DEFAULT false,
  bio text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT employees_pkey PRIMARY KEY (id),
  CONSTRAINT employees_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
  CONSTRAINT employees_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT employees_phone_check CHECK (phone ~* '^\+?[0-9\s\-\(\)]{7,20}$')
);

-- 2. Create employee availabilities table for custom schedules
CREATE TABLE public.employee_availabilities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  day_of_week integer NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT employee_availabilities_pkey PRIMARY KEY (id),
  CONSTRAINT employee_availabilities_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT employee_availabilities_day_check CHECK (day_of_week >= 0 AND day_of_week <= 6),
  CONSTRAINT employee_availabilities_time_check CHECK (start_time < end_time),
  CONSTRAINT employee_availabilities_unique UNIQUE (employee_id, day_of_week, start_time, end_time)
);

-- 3. Add employee_id to appointments table
ALTER TABLE public.appointments 
ADD COLUMN employee_id uuid NULL,
ADD CONSTRAINT appointments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Also add employee_id to reviews table
ALTER TABLE public.reviews 
ADD COLUMN employee_id uuid NULL,
ADD CONSTRAINT reviews_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;

-- 4. Create indexes for performance
CREATE INDEX idx_employees_provider ON public.employees USING btree (provider_id);
CREATE INDEX idx_employees_active ON public.employees USING btree (is_active) WHERE is_active = true;
CREATE INDEX idx_employee_availabilities_employee ON public.employee_availabilities USING btree (employee_id);
CREATE INDEX idx_employee_availabilities_day ON public.employee_availabilities USING btree (day_of_week);
CREATE INDEX idx_appointments_employee ON public.appointments USING btree (employee_id);

-- 5. Create triggers for updated_at columns
CREATE TRIGGER update_employees_updated_at 
  BEFORE UPDATE ON employees 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_availabilities_updated_at 
  BEFORE UPDATE ON employee_availabilities 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable RLS on new tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_availabilities ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for employees table

-- Allow providers to manage their own employees
CREATE POLICY "Providers can manage their employees" ON public.employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM providers p
      WHERE p.user_id = auth.uid() 
      AND p.id = employees.provider_id
    )
  );

-- Allow clients to view active employees of providers they're booking with
CREATE POLICY "Clients can view active employees" ON public.employees
  FOR SELECT USING (
    is_active = true 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'client'
    )
  );

-- Allow anonymous users to view active employees (for browsing)
CREATE POLICY "Anyone can view active employees" ON public.employees
  FOR SELECT USING (is_active = true);

-- 8. Create RLS policies for employee_availabilities table

-- Allow providers to manage availabilities for their employees
CREATE POLICY "Providers can manage employee availabilities" ON public.employee_availabilities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN providers p ON p.id = e.provider_id
      WHERE e.id = employee_availabilities.employee_id
      AND p.user_id = auth.uid()
    )
  );

-- Allow clients to view employee availabilities
CREATE POLICY "Clients can view employee availabilities" ON public.employee_availabilities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'client'
    )
  );

-- Allow anonymous users to view employee availabilities
CREATE POLICY "Anyone can view employee availabilities" ON public.employee_availabilities
  FOR SELECT USING (true);

-- 9. Create function to automatically create owner as employee when provider is created
CREATE OR REPLACE FUNCTION create_owner_employee()
RETURNS TRIGGER AS $$
BEGIN
  -- Create owner employee record
  INSERT INTO public.employees (
    provider_id,
    name,
    is_owner,
    is_active,
    custom_schedule_enabled
  ) VALUES (
    NEW.id,
    COALESCE(NEW.business_name || ' Owner', 'Owner'),
    true,
    true,
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create owner employee
CREATE TRIGGER create_owner_employee_trigger
  AFTER INSERT ON providers
  FOR EACH ROW
  EXECUTE FUNCTION create_owner_employee();

-- Update existing providers to have owner employees
INSERT INTO public.employees (provider_id, name, is_owner, is_active, custom_schedule_enabled)
SELECT p.id, COALESCE(prof.full_name, p.business_name || ' Owner'), true, true, false
FROM providers p
LEFT JOIN profiles prof ON prof.id = p.user_id
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.provider_id = p.id AND e.is_owner = true);

-- 10. Create helper function to get employee availability
CREATE OR REPLACE FUNCTION get_employee_availability(
  employee_uuid uuid,
  check_day integer
)
RETURNS TABLE(
  start_time time,
  end_time time,
  is_available boolean
) AS $$
BEGIN
  -- Check if employee has custom schedule enabled
  IF EXISTS (
    SELECT 1 FROM employees 
    WHERE id = employee_uuid 
    AND custom_schedule_enabled = true
  ) THEN
    -- Return employee's custom availability
    RETURN QUERY
    SELECT ea.start_time, ea.end_time, ea.is_available
    FROM employee_availabilities ea
    WHERE ea.employee_id = employee_uuid
    AND ea.day_of_week = check_day;
  ELSE
    -- Return provider's availability
    RETURN QUERY
    SELECT a.start_time, a.end_time, true as is_available
    FROM availabilities a
    JOIN employees e ON e.provider_id = a.provider_id
    WHERE e.id = employee_uuid
    AND a.weekday = check_day;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;