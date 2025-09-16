-- Script para verificar problemas relacionados con email
-- Este script verifica si hay restricciones que impiden el signup

-- 1. Verificar si hay usuarios con el mismo email
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'chenzouni@gmail.com';

-- 2. Verificar si hay restricciones de email único
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
  AND constraint_type = 'UNIQUE';

-- 3. Verificar índices en la columna email
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'auth' 
  AND tablename = 'users'
  AND indexdef LIKE '%email%';

-- 4. Verificar si hay funciones que validen el email
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'auth'
  AND routine_definition LIKE '%email%'
ORDER BY routine_name;
