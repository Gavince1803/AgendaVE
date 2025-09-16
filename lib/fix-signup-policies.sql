-- Script para arreglar las políticas que permiten el registro de usuarios
-- Este script verifica y arregla las políticas necesarias para el signup

-- 1. Verificar si hay políticas problemáticas en auth.users
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

-- 2. Verificar si hay triggers problemáticos en auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- 3. Verificar si hay funciones problemáticas
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'auth'
  AND routine_name LIKE '%user%'
ORDER BY routine_name;
