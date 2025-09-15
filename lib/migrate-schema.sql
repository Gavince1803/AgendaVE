-- 🔄 Script de Migración para AgendaVE
-- Aplicar cambios del schema actualizado

-- 1. Agregar tabla profiles si no existe
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    display_name TEXT,
    role TEXT NOT NULL DEFAULT 'client',
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Modificar tabla providers
-- Agregar user_id si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'providers' AND column_name = 'user_id') THEN
        ALTER TABLE public.providers ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Agregar website si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'providers' AND column_name = 'website') THEN
        ALTER TABLE public.providers ADD COLUMN website TEXT;
    END IF;
END $$;

-- Agregar category si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'providers' AND column_name = 'category') THEN
        ALTER TABLE public.providers ADD COLUMN category TEXT NOT NULL DEFAULT 'general';
    END IF;
END $$;

-- 3. Modificar tabla services
-- Cambiar price a price_amount y price_currency
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'services' AND column_name = 'price') THEN
        -- Renombrar price a price_amount
        ALTER TABLE public.services RENAME COLUMN price TO price_amount;
    END IF;
    
    -- Agregar price_currency si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'services' AND column_name = 'price_currency') THEN
        ALTER TABLE public.services ADD COLUMN price_currency TEXT NOT NULL DEFAULT 'VES';
    END IF;
END $$;

-- 4. Modificar tabla availabilities
-- Cambiar day_of_week a weekday
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'availabilities' AND column_name = 'day_of_week') THEN
        ALTER TABLE public.availabilities RENAME COLUMN day_of_week TO weekday;
    END IF;
END $$;

-- 5. Modificar tabla appointments
-- Cambiar start_time y end_time a appointment_time
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'appointments' AND column_name = 'start_time') THEN
        ALTER TABLE public.appointments RENAME COLUMN start_time TO appointment_time;
    END IF;
    
    -- Eliminar end_time si existe
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'appointments' AND column_name = 'end_time') THEN
        ALTER TABLE public.appointments DROP COLUMN end_time;
    END IF;
    
    -- Cambiar 'completed' a 'done' en status
    UPDATE public.appointments SET status = 'done' WHERE status = 'completed';
END $$;

-- 6. Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas para profiles
DROP POLICY IF EXISTS "profiles_user_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_insert" ON public.profiles;

CREATE POLICY "profiles_user_read" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_user_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_user_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 8. Actualizar políticas de providers
DROP POLICY IF EXISTS "providers_owner_all" ON public.providers;
CREATE POLICY "providers_owner_all" ON public.providers FOR ALL USING (auth.uid() = user_id);

-- 9. Actualizar políticas de services
DROP POLICY IF EXISTS "services_provider_all" ON public.services;
CREATE POLICY "services_provider_all" ON public.services FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = user_id)
);

-- 10. Actualizar políticas de availabilities
DROP POLICY IF EXISTS "availabilities_provider_all" ON public.availabilities;
CREATE POLICY "availabilities_provider_all" ON public.availabilities FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = user_id)
);

-- 11. Actualizar políticas de appointments
DROP POLICY IF EXISTS "appointments_provider_read" ON public.appointments;
DROP POLICY IF EXISTS "appointments_provider_update" ON public.appointments;

CREATE POLICY "appointments_provider_read" ON public.appointments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = user_id)
);
CREATE POLICY "appointments_provider_update" ON public.appointments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = user_id)
);

-- 12. Crear trigger para profiles
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_providers_user_id ON public.providers(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_category ON public.providers(category);
CREATE INDEX IF NOT EXISTS idx_services_price_currency ON public.services(price_currency);
CREATE INDEX IF NOT EXISTS idx_availabilities_weekday ON public.availabilities(weekday);

-- 14. Migrar datos existentes si es necesario
-- Si hay providers sin user_id, asignar el id del provider como user_id
UPDATE public.providers 
SET user_id = id 
WHERE user_id IS NULL;

-- 15. Comentarios finales
COMMENT ON TABLE public.profiles IS 'Perfiles de usuarios con roles y datos básicos';
COMMENT ON TABLE public.providers IS 'Información extendida de proveedores de servicios';
COMMENT ON TABLE public.services IS 'Servicios ofrecidos por los proveedores';
COMMENT ON TABLE public.availabilities IS 'Horarios de disponibilidad de los proveedores';
COMMENT ON TABLE public.appointments IS 'Citas agendadas entre clientes y proveedores';
COMMENT ON TABLE public.reviews IS 'Calificaciones y reseñas de los servicios';
COMMENT ON TABLE public.device_push_tokens IS 'Tokens para notificaciones push';
