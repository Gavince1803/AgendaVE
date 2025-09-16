-- Script para habilitar el signup en Supabase
-- Este script verifica y habilita el registro de usuarios si está deshabilitado

-- 1. Verificar configuración actual
SELECT 
  key,
  value
FROM auth.config
WHERE key = 'DISABLE_SIGNUP';

-- 2. Habilitar signup si está deshabilitado
UPDATE auth.config 
SET value = 'false' 
WHERE key = 'DISABLE_SIGNUP';

-- 3. Verificar que se actualizó correctamente
SELECT 
  key,
  value
FROM auth.config
WHERE key = 'DISABLE_SIGNUP';

-- 4. Verificar otras configuraciones importantes
SELECT 
  key,
  value
FROM auth.config
WHERE key IN ('SITE_URL', 'JWT_EXP', 'REFRESH_TOKEN_ROTATION_ENABLED');
