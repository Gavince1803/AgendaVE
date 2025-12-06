-- Secure RPC function to look up email by Identifier (Cedula OR Phone)
-- This function runs with SECURITY DEFINER to bypass RLS and look up the email
CREATE OR REPLACE FUNCTION public.get_email_by_identifier(identifier_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    found_email TEXT;
    clean_identifier TEXT;
BEGIN
    -- Limpiar el identificador (eliminar espacios, guiones, etc si es necesario)
    -- Por ahora asumimos que viene limpio o que la coincidencia es exacta
    clean_identifier := identifier_input;

    -- 1. Buscar por Cédula en user_identifiers
    SELECT email INTO found_email
    FROM public.user_identifiers
    WHERE cedula = clean_identifier;

    IF found_email IS NOT NULL THEN
        RETURN found_email;
    END IF;

    -- 2. Buscar por Teléfono en user_identifiers
    -- Nota: El teléfono debe estar normalizado en la base de datos para que esto funcione bien
    SELECT email INTO found_email
    FROM public.user_identifiers
    WHERE phone = clean_identifier;

    IF found_email IS NOT NULL THEN
        RETURN found_email;
    END IF;

    -- 3. Si no se encuentra en identifiers, podría ser un email directo
    -- (Aunque el cliente debería manejar esto, el RPC puede ser robusto)
    -- No podemos consultar auth.users directamente por email de manera fácil sin permisos elevados
    -- Así que retornamos NULL y dejamos que el cliente intente login normal si parece email
    
    RETURN NULL;
END;
$$;
