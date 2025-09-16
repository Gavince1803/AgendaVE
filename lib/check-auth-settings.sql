-- Script para verificar la configuración de autenticación
-- Este script verifica la configuración sin usar auth.config

-- 1. Verificar si hay restricciones en la tabla auth.users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Verificar triggers en auth.users que puedan estar bloqueando
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- 3. Verificar funciones que puedan estar afectando el signup
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'auth'
  AND routine_name LIKE '%user%'
ORDER BY routine_name;

-- 4. Verificar si hay políticas RLS en auth.users
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'auth' AND tablename = 'users'
ORDER BY policyname;
