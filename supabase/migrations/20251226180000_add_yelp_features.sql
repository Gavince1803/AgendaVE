-- Add price_tier, latitude, longitude to providers
ALTER TABLE providers ADD COLUMN IF NOT EXISTS price_tier SMALLINT CHECK (price_tier BETWEEN 1 AND 4);
ALTER TABLE providers ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Update appointments status check to include 'no_show'
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'done', 'no_show'));

-- Function to get nearby providers (Haversine Formula)
CREATE OR REPLACE FUNCTION get_nearby_providers(
  lat DOUBLE PRECISION,
  long DOUBLE PRECISION,
  radius_km DOUBLE PRECISION
)
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  price_tier SMALLINT,
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.business_name,
    p.latitude,
    p.longitude,
    p.price_tier,
    (
      6371 * acos(
        least(1.0, greatest(-1.0, 
          cos(radians(lat)) * cos(radians(p.latitude)) *
          cos(radians(p.longitude) - radians(long)) +
          sin(radians(lat)) * sin(radians(p.latitude))
        ))
      )
    ) AS distance_km
  FROM
    providers p
  WHERE
    p.latitude IS NOT NULL AND p.longitude IS NOT NULL
    AND (
      6371 * acos(
        least(1.0, greatest(-1.0, 
          cos(radians(lat)) * cos(radians(p.latitude)) *
          cos(radians(p.longitude) - radians(long)) +
          sin(radians(lat)) * sin(radians(p.latitude))
        ))
      )
    ) <= radius_km
  ORDER BY
    distance_km ASC;
END;
$$;
