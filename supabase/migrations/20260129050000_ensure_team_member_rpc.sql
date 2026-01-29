-- RPC to Ensure a Team Member Profile exists for the current Employee
-- 1. Finds the Employee record for the auth user.
-- 2. Tries to find an existing Team Member by profile_id OR name.
-- 3. If missing, CREATES a new Team Member record automatically.
-- 4. Returns the Team Member record.

CREATE OR REPLACE FUNCTION ensure_team_member_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_employee_record employees%ROWTYPE;
  v_team_member_id uuid;
  v_new_member_json jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Get the Employee Record
  SELECT * INTO v_employee_record
  FROM employees
  WHERE profile_id = v_user_id
  AND is_active = true
  LIMIT 1;

  IF v_employee_record IS NULL THEN
    -- If not an employee, this logic doesn't apply. Return null.
    RETURN NULL; 
  END IF;

  -- 2. Check if Team Member exists (linked by ID)
  SELECT id INTO v_team_member_id
  FROM provider_team_members
  WHERE profile_id = v_user_id
  AND provider_id = v_employee_record.provider_id
  LIMIT 1;

  -- 3. If not found by ID, check by Name (fuzzy/exact match fallback)
  IF v_team_member_id IS NULL THEN
     SELECT id INTO v_team_member_id
     FROM provider_team_members
     WHERE provider_id = v_employee_record.provider_id
     AND lower(trim(full_name)) = lower(trim(v_employee_record.name))
     LIMIT 1;

     -- If found by name, LINK IT PERMANENTLY
     IF v_team_member_id IS NOT NULL THEN
        UPDATE provider_team_members
        SET profile_id = v_user_id
        WHERE id = v_team_member_id;
     END IF;
  END IF;

  -- 4. If STILL null, CREATE it (Auto-Provisioning)
  IF v_team_member_id IS NULL THEN
    INSERT INTO provider_team_members (
        provider_id,
        profile_id,
        full_name,
        is_active,
        sort_order,
        created_at
    )
    VALUES (
        v_employee_record.provider_id,
        v_user_id,
        v_employee_record.name,
        true,
        99, -- Sort order
        now()
    )
    RETURNING id INTO v_team_member_id;
  END IF;
  
  -- Return the team member object
  SELECT row_to_json(ptm.*)::jsonb INTO v_new_member_json
  FROM provider_team_members ptm
  WHERE id = v_team_member_id;

  RETURN v_new_member_json;
END;
$$;
