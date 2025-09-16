-- Script para eliminar y recrear el negocio del usuario
-- Reemplaza 'TU_USER_ID_AQUI' con tu ID real de usuario

-- 1. Eliminar servicios del proveedor
DELETE FROM services WHERE provider_id IN (
  SELECT id FROM providers WHERE owner_id = 'TU_USER_ID_AQUI'
);

-- 2. Eliminar disponibilidades del proveedor
DELETE FROM availabilities WHERE provider_id IN (
  SELECT id FROM providers WHERE owner_id = 'TU_USER_ID_AQUI'
);

-- 3. Eliminar citas del proveedor
DELETE FROM appointments WHERE provider_id IN (
  SELECT id FROM providers WHERE owner_id = 'TU_USER_ID_AQUI'
);

-- 4. Eliminar reviews del proveedor
DELETE FROM reviews WHERE provider_id IN (
  SELECT id FROM providers WHERE owner_id = 'TU_USER_ID_AQUI'
);

-- 5. Eliminar el proveedor
DELETE FROM providers WHERE owner_id = 'TU_USER_ID_AQUI';

-- 6. Crear nuevo proveedor
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
  'TU_USER_ID_AQUI',
  'Mi Negocio',
  'Mi Negocio',
  'Descripción de mi negocio',
  'Dirección de mi negocio',
  '1234567890',
  'tu_email@ejemplo.com',
  'America/Caracas',
  'general',
  0.0,
  0,
  true,
  now(),
  now()
);

-- 7. Verificar que se creó correctamente
SELECT 
  id,
  owner_id,
  name,
  business_name,
  category,
  is_active,
  created_at
FROM providers 
WHERE owner_id = 'TU_USER_ID_AQUI';
