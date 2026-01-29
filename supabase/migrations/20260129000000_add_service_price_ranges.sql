-- Add input_type and price_max to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS input_type TEXT DEFAULT 'fixed' CHECK (input_type IN ('fixed', 'range', 'starting_at')),
ADD COLUMN IF NOT EXISTS price_max DECIMAL(10, 2);

-- Add constraint to ensure price_max is valid for ranges
-- We only enforce price_max >= price_amount if input_type is 'range' AND price_max is not null
ALTER TABLE services
ADD CONSTRAINT services_price_range_check 
CHECK (
  (input_type = 'range' AND price_max IS NOT NULL AND price_max >= price_amount) OR
  (input_type <> 'range') OR
  (input_type = 'range' AND price_max IS NULL) -- Allow null temporarily if needed, though app should enforce it
);

-- Comment on columns
COMMENT ON COLUMN services.input_type IS 'The type of pricing: fixed, range (min-max), or starting_at (min+)';
COMMENT ON COLUMN services.price_max IS 'The maximum price for range pricing. price_amount serves as the minimum/base price.';
