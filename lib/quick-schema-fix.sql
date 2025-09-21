-- Quick Schema Fix - Run this in your Supabase SQL Editor
-- This will resolve the availability insertion issues immediately

-- 1. Ensure is_active column exists (it should already be there)
ALTER TABLE IF EXISTS public.availabilities 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Update all existing availability records to have is_active = true
UPDATE public.availabilities 
SET is_active = true 
WHERE is_active IS NULL;

-- 3. Refresh the schema cache by updating table comments
COMMENT ON TABLE public.availabilities IS 'Provider availability schedule - updated';

-- 4. Ensure RLS policies are properly refreshed
DROP POLICY IF EXISTS "availabilities_public_read" ON public.availabilities;
CREATE POLICY "availabilities_public_read" ON public.availabilities 
FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "availabilities_provider_all" ON public.availabilities;  
CREATE POLICY "availabilities_provider_all" ON public.availabilities 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = user_id)
);

-- 5. Force schema cache refresh (run separately if needed)
-- VACUUM ANALYZE public.availabilities;

SELECT 'Schema fix applied successfully!' as status;
