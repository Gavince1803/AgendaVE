-- Redefine accept_employee_invite function with better error handling and looser constraints if needed.
-- Usage: supabase.rpc('accept_employee_invite', { token_input: '...' })

CREATE OR REPLACE FUNCTION public.accept_employee_invite(token_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (usually postgres/service_role) to bypass RLS on update if needed
SET search_path = public
AS $$
DECLARE
  v_employee_id uuid;
  v_invite_status text;
  v_expires_at timestamptz;
  v_user_id uuid;
  v_email text;
  v_updated_employee jsonb;
BEGIN
  -- Get current user context
  v_user_id := auth.uid();
  v_email := auth.email();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Search for the employee record with this token
  -- We assume 'invite_token' is the column name in 'employees' table per the TypeScript interface
  SELECT id, invite_status, invite_token_expires_at
  INTO v_employee_id, v_invite_status, v_expires_at
  FROM public.employees
  WHERE invite_token = token_input
  LIMIT 1;

  -- Validation Checks
  IF v_employee_id IS NULL THEN
    -- Debug log (visible in supabase logs)
    RAISE WARNING 'Invalid token attempt: %', token_input;
    RAISE EXCEPTION 'Código de invitación inválido';
  END IF;

  IF v_invite_status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Esta invitación ya no está válida (Estado: %)', v_invite_status;
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    RAISE EXCEPTION 'La invitación ha expirado';
  END IF;

  -- Accept the invite
  -- Link the profile_id to the current user
  -- Clear the token so it can't be used again
  UPDATE public.employees
  SET 
    profile_id = v_user_id,
    invite_status = 'accepted',
    invite_token = NULL,
    updated_at = now(),
    -- Optional: update email to match the accepting user's email if they differ?
    -- For now, we prefer to keep the email as is or maybe update it? 
    -- Let's update it to ensure consistency with the tied account.
    email = COALESCE(v_email, email) 
  WHERE id = v_employee_id
  RETURNING row_to_json(employees.*)::jsonb INTO v_updated_employee;

  RETURN v_updated_employee;
END;
$$;
