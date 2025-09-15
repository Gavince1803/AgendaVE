-- Actualizar políticas RLS para tu estructura actual

-- 1. Políticas para profiles
DROP POLICY IF EXISTS "profiles_user_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_insert" ON public.profiles;

CREATE POLICY "profiles_user_read" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_user_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_user_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Políticas para providers (usando owner_id)
DROP POLICY IF EXISTS "providers_public_read" ON public.providers;
DROP POLICY IF EXISTS "providers_owner_all" ON public.providers;

CREATE POLICY "providers_public_read" ON public.providers FOR SELECT USING (is_active = true);
CREATE POLICY "providers_owner_all" ON public.providers FOR ALL USING (auth.uid() = owner_id);

-- 3. Políticas para services
DROP POLICY IF EXISTS "services_public_read" ON public.services;
DROP POLICY IF EXISTS "services_provider_all" ON public.services;

CREATE POLICY "services_public_read" ON public.services FOR SELECT USING (is_active = true);
CREATE POLICY "services_provider_all" ON public.services FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = owner_id)
);

-- 4. Políticas para availabilities
DROP POLICY IF EXISTS "availabilities_public_read" ON public.availabilities;
DROP POLICY IF EXISTS "availabilities_provider_all" ON public.availabilities;

CREATE POLICY "availabilities_public_read" ON public.availabilities FOR SELECT USING (true);
CREATE POLICY "availabilities_provider_all" ON public.availabilities FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = owner_id)
);

-- 5. Políticas para appointments
DROP POLICY IF EXISTS "appointments_client_read" ON public.appointments;
DROP POLICY IF EXISTS "appointments_provider_read" ON public.appointments;
DROP POLICY IF EXISTS "appointments_client_insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments_provider_update" ON public.appointments;

CREATE POLICY "appointments_client_read" ON public.appointments FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "appointments_provider_read" ON public.appointments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = owner_id)
);
CREATE POLICY "appointments_client_insert" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "appointments_provider_update" ON public.appointments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = owner_id)
);

-- 6. Políticas para reviews
DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
DROP POLICY IF EXISTS "reviews_client_insert" ON public.reviews;

CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_client_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = client_id);

-- 7. Políticas para device_push_tokens
DROP POLICY IF EXISTS "device_tokens_user_all" ON public.device_push_tokens;

CREATE POLICY "device_tokens_user_all" ON public.device_push_tokens FOR ALL USING (auth.uid() = user_id);
