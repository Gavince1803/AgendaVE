DROP FUNCTION IF EXISTS get_nearby_providers(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);

CREATE OR REPLACE FUNCTION get_nearby_providers(
  user_lat DOUBLE PRECISION,
  user_long DOUBLE PRECISION,
  radius_km DOUBLE PRECISION
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  business_name TEXT,
  category TEXT,
  address TEXT,
  logo_url TEXT,
  hero_image_url TEXT,
  rating DOUBLE PRECISION,
  total_reviews INTEGER,
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
    p.name,
    p.business_name,
    p.category,
    p.address,
    p.logo_url,
    p.hero_image_url,
    COALESCE(p.rating, 0.0)::DOUBLE PRECISION as rating,
    COALESCE(p.total_reviews, 0) as total_reviews,
    p.latitude,
    p.longitude,
    p.price_tier,
    (
      6371 * acos(
        least(1.0, greatest(-1.0, 
          cos(radians(user_lat)) * cos(radians(p.latitude)) *
          cos(radians(p.longitude) - radians(user_long)) +
          sin(radians(user_lat)) * sin(radians(p.latitude))
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
          cos(radians(user_lat)) * cos(radians(p.latitude)) *
          cos(radians(p.longitude) - radians(user_long)) +
          sin(radians(user_lat)) * sin(radians(p.latitude))
        ))
      )
    ) <= radius_km
  ORDER BY
    distance_km ASC;
END;
$$;
