-- Enable RLS on employee_availabilities
ALTER TABLE public.employee_availabilities ENABLE ROW LEVEL SECURITY;

-- Policy: Employees can read their own availability
CREATE POLICY "employees_read_own_availability" ON public.employee_availabilities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE id = employee_availabilities.employee_id
    AND profile_id = auth.uid()
  )
);

-- Policy: Employees can update their own availability
CREATE POLICY "employees_update_own_availability" ON public.employee_availabilities
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE id = employee_availabilities.employee_id
    AND profile_id = auth.uid()
  )
);

-- Policy: Employees can insert their own availability
CREATE POLICY "employees_insert_own_availability" ON public.employee_availabilities
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE id = employee_availabilities.employee_id
    AND profile_id = auth.uid()
  )
);

-- Policy: Employees can delete their own availability
CREATE POLICY "employees_delete_own_availability" ON public.employee_availabilities
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.employees
    WHERE id = employee_availabilities.employee_id
    AND profile_id = auth.uid()
  )
);

-- Policy: Providers can manage their employees' availability
-- (Assuming providers can already do this, but adding for completeness/safety)
CREATE POLICY "providers_manage_employees_availability" ON public.employee_availabilities
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.employees
    JOIN public.providers ON employees.provider_id = providers.id
    WHERE employees.id = employee_availabilities.employee_id
    AND providers.user_id = auth.uid()
  )
);
