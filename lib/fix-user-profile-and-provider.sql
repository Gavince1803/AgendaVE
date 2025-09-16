-- Script para arreglar el perfil del usuario y crear el proveedor
-- Reemplaza 'TU_USER_ID' con tu ID real de usuario

-- 1. Crear o actualizar el perfil del usuario
INSERT INTO profiles (
  id,
  display_name,
  phone,
  role,
  created_at,
  updated_at
) VALUES (
  'TU_USER_ID',
  'Mi Negocio',
  '1234567890',
  'provider',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'provider',
  updated_at = now();

-- 2. Eliminar proveedor existente si existe
DELETE FROM providers WHERE owner_id = 'TU_USER_ID';

-- 3. Crear nuevo proveedor
INSERT INTO providers (
  id,
  owner_id,
  name,
  business_name,
  bio,
  address,
  phone,
  email,
  timezone,
  category,
  rating,
  total_reviews,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'TU_USER_ID',
  'Mi Negocio',
  'Mi Negocio',
  'Descripción de mi negocio',
  'Dirección de mi negocio',
  '1234567890',
  'chenzouni@gmail.com',
  'America/Caracas',
  'general',
  0.0,
  0,
  true,
  now(),
  now()
);

-- 4. Verificar que todo se creó correctamente
SELECT 
  'PROFILE' as type,
  p.id,
  p.display_name,
  p.role,
  p.created_at
FROM profiles p
WHERE p.id = 'TU_USER_ID'

UNION ALL

SELECT 
  'PROVIDER' as type,
  pr.id,
  pr.business_name,
  pr.category,
  pr.created_at
FROM providers pr
WHERE pr.owner_id = 'TU_USER_ID';
