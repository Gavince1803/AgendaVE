-- Verificar el estado del usuario y su perfil
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created,
  p.id as profile_id,
  p.display_name,
  p.role,
  p.created_at as profile_created
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'chenzouni@gmail.com';
