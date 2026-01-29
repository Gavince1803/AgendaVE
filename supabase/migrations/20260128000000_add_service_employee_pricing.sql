-- Create table for custom service pricing per employee
CREATE TABLE IF NOT EXISTS service_employee_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES provider_team_members(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  duration_minutes INTEGER, -- Optional custom duration
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure unique combination of service and employee
  UNIQUE(service_id, employee_id)
);

-- Enable RLS
ALTER TABLE service_employee_pricing ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access (for booking flow)
CREATE POLICY "Service employee pricing is viewable by everyone"
  ON service_employee_pricing FOR SELECT
  USING (true);

-- Policy: Providers can manage their own pricing
-- We link through service_id -> services -> provider_id
CREATE POLICY "Providers can manage their own employee pricing"
  ON service_employee_pricing FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM services s
      WHERE s.id = service_employee_pricing.service_id
      AND s.provider_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_service_employee_pricing_service ON service_employee_pricing(service_id);
CREATE INDEX idx_service_employee_pricing_employee ON service_employee_pricing(employee_id);

-- Trigger to update updated_at
CREATE TRIGGER update_service_employee_pricing_updated_at
  BEFORE UPDATE ON service_employee_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
