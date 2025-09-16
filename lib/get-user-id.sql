-- Script para obtener tu ID de usuario
-- Ejecuta este script primero para obtener tu ID

SELECT 
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'chenzouni@gmail.com';
