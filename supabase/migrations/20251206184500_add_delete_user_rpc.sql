-- RPC function to allow users to delete their own account
-- This must run as SECURITY DEFINER to access auth.users
CREATE OR REPLACE FUNCTION public.delete_own_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the user calls it for themselves (redundant with SELECT/USING but good for safety)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete from auth.users (Cascades to public.profiles, etc. if configured, otherwise profiles should be deleted manually or via trigger)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
 