-- Script para arreglar el perfil del usuario específico
-- Reemplaza '1e7f9ed0-0fd6-433c-9ad8-29a3c31fb91b' con tu ID real si es diferente

-- 1. Eliminar perfil existente si existe
DELETE FROM profiles WHERE id = '1e7f9ed0-0fd6-433c-9ad8-29a3c31fb91b';

-- 2. Crear nuevo perfil
INSERT INTO profiles (
  id,
  display_name,
  phone,
  role,
  created_at,
  updated_at
) VALUES (
  '1e7f9ed0-0fd6-433c-9ad8-29a3c31fb91b',
  'Mi Negocio',
  '1234567890',
  'provider',
  now(),
  now()
);

-- 3. Eliminar proveedor existente si existe
DELETE FROM providers WHERE owner_id = '1e7f9ed0-0fd6-433c-9ad8-29a3c31fb91b';

-- 4. Crear nuevo proveedor
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
  '1e7f9ed0-0fd6-433c-9ad8-29a3c31fb91b',
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

-- 5. Verificar que todo se creó correctamente
SELECT 
  'PROFILE' as type,
  p.id,
  p.display_name,
  p.role,
  p.created_at
FROM profiles p
WHERE p.id = '1e7f9ed0-0fd6-433c-9ad8-29a3c31fb91b'

UNION ALL

SELECT 
  'PROVIDER' as type,
  pr.id,
  pr.business_name,
  pr.category,
  pr.created_at
FROM providers pr
WHERE pr.owner_id = '1e7f9ed0-0fd6-433c-9ad8-29a3c31fb91b';
