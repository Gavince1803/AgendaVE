-- Paso 6: Actualizar políticas RLS
-- Actualizar políticas de providers
DROP POLICY IF EXISTS "providers_owner_all" ON public.providers;
CREATE POLICY "providers_owner_all" ON public.providers FOR ALL USING (auth.uid() = user_id);

-- Actualizar políticas de services
DROP POLICY IF EXISTS "services_provider_all" ON public.services;
CREATE POLICY "services_provider_all" ON public.services FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = user_id)
);

-- Actualizar políticas de availabilities
DROP POLICY IF EXISTS "availabilities_provider_all" ON public.availabilities;
CREATE POLICY "availabilities_provider_all" ON public.availabilities FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = user_id)
);

-- Actualizar políticas de appointments
DROP POLICY IF EXISTS "appointments_provider_read" ON public.appointments;
DROP POLICY IF EXISTS "appointments_provider_update" ON public.appointments;

CREATE POLICY "appointments_provider_read" ON public.appointments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = user_id)
);
CREATE POLICY "appointments_provider_update" ON public.appointments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = user_id)
);
