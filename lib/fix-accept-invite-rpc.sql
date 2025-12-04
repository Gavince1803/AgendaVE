-- 🔒 Función segura para aceptar invitaciones de empleados
-- Esta función se ejecuta con privilegios de definidor (admin) para bypassar RLS durante la aceptación

CREATE OR REPLACE FUNCTION public.accept_employee_invite(token_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    match_employee public.employees%ROWTYPE;
    current_user_id UUID;
BEGIN
    -- Obtener ID del usuario actual
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión para aceptar la invitación';
    END IF;

    -- 1. Buscar la invitación
    SELECT * INTO match_employee
    FROM public.employees
    WHERE invite_token = token_input
    LIMIT 1;

    IF match_employee IS NULL THEN
        RAISE EXCEPTION 'Código de invitación inválido';
    END IF;

    -- 2. Validaciones
    IF match_employee.profile_id IS NOT NULL THEN
        RAISE EXCEPTION 'Esta invitación ya fue utilizada por otro usuario';
    END IF;

    IF match_employee.invite_token_expires_at IS NOT NULL AND match_employee.invite_token_expires_at < NOW() THEN
        RAISE EXCEPTION 'La invitación ha expirado';
    END IF;

    -- 3. Actualizar el empleado
    UPDATE public.employees
    SET 
        profile_id = current_user_id,
        invite_status = 'accepted',
        invite_token = NULL,
        invite_token_expires_at = NULL,
        is_active = true,
        updated_at = NOW()
    WHERE id = match_employee.id
    RETURNING * INTO match_employee;

    -- 4. Retornar el registro actualizado como JSON
    RETURN to_jsonb(match_employee);
END;
$$;

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.accept_employee_invite(TEXT) TO authenticated;
