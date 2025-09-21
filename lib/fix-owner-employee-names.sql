-- Script para corregir nombres de empleados propietarios
-- Los propietarios actualmente tienen nombres como "email@domain.com Owner"
-- Este script los actualiza para usar el display_name del perfil

UPDATE employees 
SET name = CONCAT(profiles.display_name, ' Owner')
FROM providers, profiles 
WHERE employees.provider_id = providers.id 
  AND providers.user_id = profiles.id 
  AND employees.is_owner = true
  AND employees.name LIKE '%@%Owner';

-- También actualizar empleados que simplemente tienen el email como nombre
UPDATE employees 
SET name = profiles.display_name
FROM providers, profiles 
WHERE employees.provider_id = providers.id 
  AND providers.user_id = profiles.id 
  AND employees.is_owner = true
  AND employees.name LIKE '%@%'
  AND employees.name NOT LIKE '%Owner';
