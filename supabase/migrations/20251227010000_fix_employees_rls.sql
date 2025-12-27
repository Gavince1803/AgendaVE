-- Enable RLS on employees table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Allow public read access to employees (needed for booking)
CREATE POLICY "Public read access for employees"
ON employees FOR SELECT
USING (true);

-- Allow providers to insert employees for their own business
CREATE POLICY "Providers can insert their own employees"
ON employees FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM providers WHERE id = provider_id
  )
);

-- Allow providers to update their own employees
CREATE POLICY "Providers can update their own employees"
ON employees FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM providers WHERE id = provider_id
  )
);

-- Allow providers to delete their own employees
CREATE POLICY "Providers can delete their own employees"
ON employees FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM providers WHERE id = provider_id
  )
);
