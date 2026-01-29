-- RPC to securely link a user to their public team member profile
-- This is needed because sometimes the link is missing (profile_id is null) 
-- even if the user is a valid employee.

CREATE OR REPLACE FUNCTION link_user_to_team_member(member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_provider_id uuid;
BEGIN
  -- 1. Get the provider_id for this team member
  SELECT provider_id INTO v_provider_id 
  FROM provider_team_members 
  WHERE id = member_id;

  IF v_provider_id IS NULL THEN
    RAISE EXCEPTION 'Team member not found';
  END IF;

  -- 2. Verify that the current user (auth.uid()) is listed as an EMPLOYEE or PROVIDER for this provider_id
  -- Check Employees table
  IF EXISTS (SELECT 1 FROM employees WHERE profile_id = auth.uid() AND provider_id = v_provider_id) 
     OR 
     -- Check Providers table (owner)
     EXISTS (SELECT 1 FROM providers WHERE user_id = auth.uid() AND id = v_provider_id)
  THEN
    -- 3. Perform the link
    UPDATE provider_team_members 
    SET profile_id = auth.uid() 
    WHERE id = member_id;
  ELSE
    RAISE EXCEPTION 'Permission denied: User is not associated with this provider.';
  END IF;
END;
$$;
