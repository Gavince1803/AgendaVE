-- Fix the missing Foreign Key for service_id in reviews table
-- This resolves: "Could not find a relationship between 'reviews' and 'services'"

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_service_id_fkey;

ALTER TABLE reviews
ADD CONSTRAINT reviews_service_id_fkey
FOREIGN KEY (service_id)
REFERENCES services(id)
ON DELETE SET NULL; -- If a service is deleted, keep the review but nullify the service link? Or CASCADE? Usually reviews are tied to a service. Let's use SET NULL or CASCADE.
-- Given the error, we just need the link.
-- Ideally: ON DELETE SET NULL to preserve the review history even if service is gone.

-- Force a schema cache reload
NOTIFY pgrst, 'reload schema';
