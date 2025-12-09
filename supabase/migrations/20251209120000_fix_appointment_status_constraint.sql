-- Migration to fix appointments_status_check constraint
-- The original constraint likely didn't include 'done' or 'completed'

-- First, drop the existing constraint
ALTER TABLE "public"."appointments" DROP CONSTRAINT IF EXISTS "appointments_status_check";

-- Re-add the constraint with all necessary statuses
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_status_check" 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'no_show', 'done', 'completed'));

-- Comment to explain the change
COMMENT ON CONSTRAINT "appointments_status_check" ON "public"."appointments" IS 'Ensures appointment status is valid, including done/completed states';
