-- Script específico para tu estructura actual
-- Basado en el análisis de tu base de datos

-- 1. Arreglar tabla profiles - agregar email y full_name
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Arreglar tabla providers - cambiar owner_id a user_id
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Migrar datos: asignar user_id = owner_id donde sea NULL
UPDATE public.providers 
SET user_id = owner_id 
WHERE user_id IS NULL;

-- 3. Arreglar tabla services - eliminar columna price duplicada
ALTER TABLE public.services DROP COLUMN IF EXISTS price;

-- 4. Arreglar tabla appointments - eliminar columnas innecesarias
ALTER TABLE public.appointments DROP COLUMN IF EXISTS start_ts;
ALTER TABLE public.appointments DROP COLUMN IF EXISTS end_ts;
ALTER TABLE public.appointments DROP COLUMN IF EXISTS booking_range;

-- 5. Arreglar tabla device_push_tokens - cambiar expo_token a token
ALTER TABLE public.device_push_tokens ADD COLUMN IF NOT EXISTS token TEXT;
ALTER TABLE public.device_push_tokens ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'mobile';
ALTER TABLE public.device_push_tokens ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.device_push_tokens ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Migrar datos: token = expo_token donde sea NULL
UPDATE public.device_push_tokens 
SET token = expo_token 
WHERE token IS NULL;

-- 6. Crear índices necesarios
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_providers_user_id ON public.providers(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_owner_id ON public.providers(owner_id);
CREATE INDEX IF NOT EXISTS idx_services_price_currency ON public.services(price_currency);
CREATE INDEX IF NOT EXISTS idx_availabilities_weekday ON public.availabilities(weekday);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_push_tokens(user_id);
