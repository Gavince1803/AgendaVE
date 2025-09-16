-- Arreglar políticas RLS de availabilities que referencian is_active
-- Primero eliminar las políticas problemáticas
DROP POLICY IF EXISTS "availabilities_public_read" ON public.availabilities;
DROP POLICY IF EXISTS "availabilities_provider_all" ON public.availabilities;
DROP POLICY IF EXISTS "availabilities_write_owner" ON public.availabilities;

-- Crear nuevas políticas sin referenciar is_active
CREATE POLICY "availabilities_public_read" ON public.availabilities 
FOR SELECT 
USING (true);

CREATE POLICY "availabilities_provider_all" ON public.availabilities 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM providers 
    WHERE providers.id = availabilities.provider_id 
    AND auth.uid() = providers.owner_id
  )
);

CREATE POLICY "availabilities_write_owner" ON public.availabilities 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM providers p 
    WHERE p.id = availabilities.provider_id 
    AND (p.owner_id = auth.uid() OR is_admin(auth.uid()))
  )
);
