-- Script para arreglar las políticas RLS de la tabla profiles
-- Este script elimina las políticas problemáticas y crea unas nuevas más simples

-- 1. Eliminar todas las políticas existentes de profiles
DROP POLICY IF EXISTS "profiles_authenticated_all" ON profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
DROP POLICY IF EXISTS "profiles_owner_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_owner" ON profiles;
DROP POLICY IF EXISTS "profiles_update_owner" ON profiles;

-- 2. Crear políticas simples y funcionales
-- Política para que los usuarios autenticados puedan leer su propio perfil
CREATE POLICY "profiles_read_own" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política para que los usuarios autenticados puedan insertar su propio perfil
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Política para que los usuarios autenticados puedan actualizar su propio perfil
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
