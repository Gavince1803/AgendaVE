-- 1. Add service_id column to reviews if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'service_id') THEN
    ALTER TABLE reviews ADD COLUMN service_id UUID;
  END IF;
END $$;

-- 2. Backfill service_id from the linked appointment
-- This ensures existing reviews get their service data
UPDATE reviews r
SET service_id = a.service_id
FROM appointments a
WHERE r.appointment_id = a.id
AND r.service_id IS NULL;

-- 3. Add the Foreign Key constraint
-- Now that we have the column, we can link it
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_service_id_fkey;

ALTER TABLE reviews
ADD CONSTRAINT reviews_service_id_fkey
FOREIGN KEY (service_id)
REFERENCES services(id)
ON DELETE SET NULL;

-- 4. Force schema reload
NOTIFY pgrst, 'reload schema';
