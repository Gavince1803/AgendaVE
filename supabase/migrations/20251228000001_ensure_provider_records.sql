-- Ensure all users with role 'provider' have a corresponding record in the 'providers' table
INSERT INTO providers (user_id, business_name, phone, address, updated_at)
SELECT p.id, COALESCE(p.display_name, 'Mi Negocio'), '0000-0000000', 'Sin dirección', NOW()
FROM profiles p
WHERE p.role = 'provider'
AND NOT EXISTS (
  SELECT 1 FROM providers prov WHERE prov.user_id = p.id
);

-- Diagnostic: Show me verify the providers table now
SELECT * FROM providers;
