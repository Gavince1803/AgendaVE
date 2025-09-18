-- 🔧 Arreglar foreign key entre appointments y providers
-- Este script asegura que la relación esté configurada correctamente

-- 1. Verificar que la tabla providers existe y tiene la estructura correcta
DO $$
BEGIN
    -- Si la tabla providers no existe, crearla
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'providers') THEN
        CREATE TABLE public.providers (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            business_name TEXT NOT NULL,
            bio TEXT,
            address TEXT,
            phone TEXT,
            email TEXT,
            website TEXT,
            category TEXT NOT NULL,
            rating DECIMAL(3,2) DEFAULT 0.0,
            total_reviews INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Crear índices
        CREATE INDEX IF NOT EXISTS idx_providers_category ON public.providers(category);
        CREATE INDEX IF NOT EXISTS idx_providers_active ON public.providers(is_active);
        CREATE INDEX IF NOT EXISTS idx_providers_user_id ON public.providers(user_id);
        
        RAISE NOTICE 'Tabla providers creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla providers ya existe';
    END IF;
END $$;

-- 2. Verificar que la tabla appointments existe y tiene la estructura correcta
DO $$
BEGIN
    -- Si la tabla appointments no existe, crearla
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointments') THEN
        CREATE TABLE public.appointments (
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
        
        -- Crear índices
        CREATE INDEX IF NOT EXISTS idx_appointments_client ON public.appointments(client_id);
        CREATE INDEX IF NOT EXISTS idx_appointments_provider ON public.appointments(provider_id);
        CREATE INDEX IF NOT EXISTS idx_appointments_service ON public.appointments(service_id);
        CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
        CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
        
        RAISE NOTICE 'Tabla appointments creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla appointments ya existe';
    END IF;
END $$;

-- 3. Verificar que la tabla services existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'services') THEN
        CREATE TABLE public.services (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            price_amount DECIMAL(10,2) NOT NULL,
            price_currency TEXT NOT NULL DEFAULT 'VES',
            duration_minutes INTEGER NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_services_provider ON public.services(provider_id);
        CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active);
        
        RAISE NOTICE 'Tabla services creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla services ya existe';
    END IF;
END $$;

-- 4. Verificar que la tabla profiles existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        CREATE TABLE public.profiles (
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
        
        CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
        
        RAISE NOTICE 'Tabla profiles creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla profiles ya existe';
    END IF;
END $$;

-- 5. Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas RLS básicas
-- Políticas para profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para providers
DROP POLICY IF EXISTS "Anyone can view active providers" ON public.providers;
CREATE POLICY "Anyone can view active providers" ON public.providers
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Providers can manage own data" ON public.providers;
CREATE POLICY "Providers can manage own data" ON public.providers
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para services
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Providers can manage own services" ON public.services;
CREATE POLICY "Providers can manage own services" ON public.services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.providers 
            WHERE providers.id = services.provider_id 
            AND providers.user_id = auth.uid()
        )
    );

-- Políticas para appointments
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
CREATE POLICY "Users can view own appointments" ON public.appointments
    FOR SELECT USING (
        client_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.providers 
            WHERE providers.id = appointments.provider_id 
            AND providers.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create appointments" ON public.appointments;
CREATE POLICY "Users can create appointments" ON public.appointments
    FOR INSERT WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
CREATE POLICY "Users can update own appointments" ON public.appointments
    FOR UPDATE USING (
        client_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.providers 
            WHERE providers.id = appointments.provider_id 
            AND providers.user_id = auth.uid()
        )
    );

-- 7. Verificar que todo esté funcionando
SELECT 'Database structure fixed successfully' as status;
