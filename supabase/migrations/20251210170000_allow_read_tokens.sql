-- Allow authenticated users to read device tokens (needed for client-side notification sending)
-- This allows User A (Client) to fetch User B (Provider) token to send them a push notification.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'device_push_tokens'
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users"
        ON "public"."device_push_tokens"
        AS PERMISSIVE
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END $$;
