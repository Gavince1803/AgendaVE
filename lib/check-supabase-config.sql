-- Script para verificar la configuración de Supabase
-- Este script verifica si hay problemas con la configuración que impiden el signup

-- 1. Verificar configuración de autenticación
SELECT 
  key,
  value
FROM auth.config
WHERE key IN ('SITE_URL', 'DISABLE_SIGNUP', 'ENABLE_SIGNUP', 'JWT_EXP', 'REFRESH_TOKEN_ROTATION_ENABLED');

-- 2. Verificar si hay restricciones en auth.users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Verificar triggers en auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- 4. Verificar si hay funciones que puedan estar bloqueando el signup
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'auth'
  AND (routine_definition LIKE '%signup%' OR routine_definition LIKE '%user%')
ORDER BY routine_name;
