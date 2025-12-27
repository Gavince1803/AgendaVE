-- First, remove duplicate reviews, keeping the most recent one
DELETE FROM reviews
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY client_id, provider_id ORDER BY created_at DESC) as r_num
    FROM reviews
  ) t
  WHERE t.r_num > 1
);

-- Then create the unique index
CREATE UNIQUE INDEX IF NOT EXISTS unique_review_per_client_provider 
ON reviews (client_id, provider_id);

-- Optional: Add a comment
COMMENT ON INDEX unique_review_per_client_provider IS 'Ensures a client can only leave one review per provider';
