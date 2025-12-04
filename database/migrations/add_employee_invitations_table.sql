-- Create employee_invitations table for tracking invitation emails
CREATE TABLE IF NOT EXISTS employee_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employee_invitations_token ON employee_invitations(token);
CREATE INDEX IF NOT EXISTS idx_employee_invitations_employee_id ON employee_invitations(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_invitations_expires_at ON employee_invitations(expires_at);

-- Enable RLS
ALTER TABLE employee_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Providers can view invitations for their employees
CREATE POLICY "Providers can view their employee invitations"
  ON employee_invitations
  FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

-- Policy: Providers can create invitations for their employees
CREATE POLICY "Providers can create employee invitations"
  ON employee_invitations
  FOR INSERT
  WITH CHECK (
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
  );

-- Policy: Allow public read for token verification (with token)
-- This allows the employee to verify their invitation link
CREATE POLICY "Public can verify invitation tokens"
  ON employee_invitations
  FOR SELECT
  USING (true);

-- Policy: Allow system to mark tokens as used
CREATE POLICY "System can update invitation status"
  ON employee_invitations
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employee_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employee_invitations_updated_at_trigger
  BEFORE UPDATE ON employee_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_invitations_updated_at();

-- Add comment
COMMENT ON TABLE employee_invitations IS 'Stores employee invitation tokens for email invitations';
