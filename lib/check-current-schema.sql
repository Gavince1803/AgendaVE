-- Verificar estructura actual de la base de datos
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'providers', 'services', 'availabilities', 'appointments', 'reviews', 'device_push_tokens')
ORDER BY table_name, ordinal_position;
