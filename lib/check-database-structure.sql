-- 🔍 Verificar estructura de la base de datos
-- Este script verifica que todas las tablas y relaciones existan correctamente

-- Verificar que las tablas existan
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'providers', 'services', 'availabilities', 'appointments', 'reviews', 'device_push_tokens')
ORDER BY table_name;

-- Verificar la estructura de la tabla providers
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'providers'
ORDER BY ordinal_position;

-- Verificar la estructura de la tabla appointments
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'appointments'
ORDER BY ordinal_position;

-- Verificar las foreign keys de appointments
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'appointments'
    AND tc.table_schema = 'public';

-- Verificar que la tabla providers tenga datos
SELECT COUNT(*) as provider_count FROM public.providers;

-- Verificar que la tabla appointments tenga datos
SELECT COUNT(*) as appointment_count FROM public.appointments;
