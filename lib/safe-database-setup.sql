-- 🔒 Script Seguro para Configurar Base de Datos
-- Verifica existencia antes de crear tablas y políticas

-- 1. Verificar y crear tabla de proveedores (solo si no existe)
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    business_name TEXT NOT NULL,
    bio TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    category TEXT NOT NULL,
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Verificar y crear tabla de servicios
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Verificar y crear tabla de disponibilidad
CREATE TABLE IF NOT EXISTS public.availabilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Verificar y crear tabla de citas
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Verificar y crear tabla de reseñas
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Verificar y crear tabla de tokens de notificaciones
CREATE TABLE IF NOT EXISTS public.device_push_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL,
    platform TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Crear índices solo si no existen
CREATE INDEX IF NOT EXISTS idx_providers_category ON public.providers(category);
CREATE INDEX IF NOT EXISTS idx_providers_active ON public.providers(is_active);
CREATE INDEX IF NOT EXISTS idx_services_provider ON public.services(provider_id);
CREATE INDEX IF NOT EXISTS idx_availabilities_provider ON public.availabilities(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider ON public.appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON public.reviews(provider_id);

-- 8. Habilitar RLS solo si no está habilitado
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'providers' AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'services' AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'availabilities' AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.availabilities ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'appointments' AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'reviews' AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'device_push_tokens' AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.device_push_tokens ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 9. Crear políticas solo si no existen
DO $$
BEGIN
    -- Políticas para providers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'providers' AND policyname = 'providers_public_read') THEN
        CREATE POLICY "providers_public_read" ON public.providers FOR SELECT USING (is_active = true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'providers' AND policyname = 'providers_owner_all') THEN
        CREATE POLICY "providers_owner_all" ON public.providers FOR ALL USING (auth.uid() = id);
    END IF;
    
    -- Políticas para services
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'services_public_read') THEN
        CREATE POLICY "services_public_read" ON public.services FOR SELECT USING (is_active = true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'services_provider_all') THEN
        CREATE POLICY "services_provider_all" ON public.services FOR ALL USING (
            EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = id)
        );
    END IF;
    
    -- Políticas para availabilities
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'availabilities' AND policyname = 'availabilities_public_read') THEN
        CREATE POLICY "availabilities_public_read" ON public.availabilities FOR SELECT USING (is_active = true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'availabilities' AND policyname = 'availabilities_provider_all') THEN
        CREATE POLICY "availabilities_provider_all" ON public.availabilities FOR ALL USING (
            EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = id)
        );
    END IF;
    
    -- Políticas para appointments
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'appointments_client_read') THEN
        CREATE POLICY "appointments_client_read" ON public.appointments FOR SELECT USING (auth.uid() = client_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'appointments_provider_read') THEN
        CREATE POLICY "appointments_provider_read" ON public.appointments FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = id)
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'appointments_client_insert') THEN
        CREATE POLICY "appointments_client_insert" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = client_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'appointments_provider_update') THEN
        CREATE POLICY "appointments_provider_update" ON public.appointments FOR UPDATE USING (
            EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = id)
        );
    END IF;
    
    -- Políticas para reviews
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'reviews_public_read') THEN
        CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'reviews_client_insert') THEN
        CREATE POLICY "reviews_client_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = client_id);
    END IF;
    
    -- Políticas para device_push_tokens
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'device_push_tokens' AND policyname = 'device_tokens_user_all') THEN
        CREATE POLICY "device_tokens_user_all" ON public.device_push_tokens FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- 10. Crear función de trigger solo si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Crear triggers solo si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_providers_updated_at') THEN
        CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON public.providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_services_updated_at') THEN
        CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_availabilities_updated_at') THEN
        CREATE TRIGGER update_availabilities_updated_at BEFORE UPDATE ON public.availabilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_appointments_updated_at') THEN
        CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_device_tokens_updated_at') THEN
        CREATE TRIGGER update_device_tokens_updated_at BEFORE UPDATE ON public.device_push_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 12. Verificar que todo se creó correctamente
SELECT 'Tablas creadas:' as info, 
       COUNT(*) as count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('providers', 'services', 'availabilities', 'appointments', 'reviews', 'device_push_tokens');

SELECT 'Políticas RLS creadas:' as info, 
       COUNT(*) as count 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('providers', 'services', 'availabilities', 'appointments', 'reviews', 'device_push_tokens');
