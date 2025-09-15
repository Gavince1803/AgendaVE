-- Script final simple para tu estructura actual
-- Ejecutar este script en Supabase SQL Editor

-- 1. Agregar campos faltantes a profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Agregar user_id a providers (para compatibilidad)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Agregar campos faltantes a device_push_tokens
ALTER TABLE public.device_push_tokens ADD COLUMN IF NOT EXISTS token TEXT;
ALTER TABLE public.device_push_tokens ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'mobile';
ALTER TABLE public.device_push_tokens ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.device_push_tokens ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Migrar datos: token = expo_token
UPDATE public.device_push_tokens 
SET token = expo_token 
WHERE token IS NULL;

-- 5. Crear índices
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_providers_owner_id ON public.providers(owner_id);
CREATE INDEX IF NOT EXISTS idx_services_price_currency ON public.services(price_currency);
CREATE INDEX IF NOT EXISTS idx_availabilities_weekday ON public.availabilities(weekday);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_push_tokens(user_id);

-- 6. Actualizar políticas RLS
DROP POLICY IF EXISTS "providers_owner_all" ON public.providers;
CREATE POLICY "providers_owner_all" ON public.providers FOR ALL USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "services_provider_all" ON public.services;
CREATE POLICY "services_provider_all" ON public.services FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = owner_id)
);

DROP POLICY IF EXISTS "availabilities_provider_all" ON public.availabilities;
CREATE POLICY "availabilities_provider_all" ON public.availabilities FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = owner_id)
);

DROP POLICY IF EXISTS "appointments_provider_read" ON public.appointments;
DROP POLICY IF EXISTS "appointments_provider_update" ON public.appointments;

CREATE POLICY "appointments_provider_read" ON public.appointments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = owner_id)
);
CREATE POLICY "appointments_provider_update" ON public.appointments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = owner_id)
);
