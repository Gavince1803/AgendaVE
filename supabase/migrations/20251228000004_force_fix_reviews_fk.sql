-- Forcefully drop the constraint if it exists (to clear any bad state)
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_client_id_fkey;

-- Re-create the constraint explicitly
-- This links reviews.client_id -> profiles.id
ALTER TABLE reviews
ADD CONSTRAINT reviews_client_id_fkey
FOREIGN KEY (client_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Force a schema cache reload
NOTIFY pgrst, 'reload schema';
