-- 📊 Esquema de Base de Datos para AgendaVE
-- Tablas principales para el flujo cliente-proveedor

-- 0. Tabla de perfiles de usuarios
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    display_name TEXT,
    role TEXT NOT NULL DEFAULT 'client', -- 'client', 'provider', 'admin'
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. Tabla de proveedores (info extendida)
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    business_name TEXT NOT NULL,
    bio TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    category TEXT NOT NULL, -- 'hair', 'beauty', 'spa', 'barber', etc.
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de servicios
CREATE TABLE IF NOT EXISTS public.services (
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

-- 3. Tabla de disponibilidad
CREATE TABLE IF NOT EXISTS public.availabilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
    weekday INTEGER NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de citas
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'done'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de reseñas
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabla de tokens de notificaciones push
CREATE TABLE IF NOT EXISTS public.device_push_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'ios', 'android'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_providers_category ON public.providers(category);
CREATE INDEX IF NOT EXISTS idx_providers_active ON public.providers(is_active);
CREATE INDEX IF NOT EXISTS idx_services_provider ON public.services(provider_id);
CREATE INDEX IF NOT EXISTS idx_availabilities_provider ON public.availabilities(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider ON public.appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON public.reviews(provider_id);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_push_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles (cada usuario ve solo su perfil, admin ve todos)
CREATE POLICY "profiles_user_read" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_user_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_user_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para providers (público puede leer, solo el dueño puede editar)
CREATE POLICY "providers_public_read" ON public.providers FOR SELECT USING (is_active = true);
CREATE POLICY "providers_owner_all" ON public.providers FOR ALL USING (auth.uid() = user_id);

-- Políticas para services (público puede leer, solo el proveedor puede editar)
CREATE POLICY "services_public_read" ON public.services FOR SELECT USING (is_active = true);
CREATE POLICY "services_provider_all" ON public.services FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = user_id)
);

-- Políticas para availabilities (público puede leer, solo el proveedor puede editar)
CREATE POLICY "availabilities_public_read" ON public.availabilities FOR SELECT USING (is_active = true);
CREATE POLICY "availabilities_provider_all" ON public.availabilities FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = user_id)
);

-- Políticas para appointments (cliente y proveedor pueden ver sus citas)
CREATE POLICY "appointments_client_read" ON public.appointments FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "appointments_provider_read" ON public.appointments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = user_id)
);
CREATE POLICY "appointments_client_insert" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "appointments_provider_update" ON public.appointments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND auth.uid() = user_id)
);

-- Políticas para reviews (público puede leer, solo el cliente puede crear)
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_client_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Políticas para device_push_tokens (solo el usuario puede gestionar sus tokens)
CREATE POLICY "device_tokens_user_all" ON public.device_push_tokens FOR ALL USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON public.providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_availabilities_updated_at BEFORE UPDATE ON public.availabilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_device_tokens_updated_at BEFORE UPDATE ON public.device_push_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
