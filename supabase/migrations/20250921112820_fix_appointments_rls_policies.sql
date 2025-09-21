-- Fix RLS policies for appointments table to allow proper updates

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own appointments as clients" ON appointments;
DROP POLICY IF EXISTS "Users can view their own appointments as providers" ON appointments;
DROP POLICY IF EXISTS "Users can insert their own appointments as clients" ON appointments;
DROP POLICY IF EXISTS "Users can update their own appointments as clients" ON appointments;
DROP POLICY IF EXISTS "Users can update their own appointments as providers" ON appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments as clients" ON appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments as providers" ON appointments;

-- Create comprehensive RLS policies for appointments
-- 1. SELECT policies
CREATE POLICY "Clients can view their own appointments" ON appointments
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Providers can view their appointments" ON appointments
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM providers WHERE id = provider_id
        )
    );

-- 2. INSERT policies
CREATE POLICY "Clients can create their own appointments" ON appointments
    FOR INSERT WITH CHECK (auth.uid() = client_id);

-- 3. UPDATE policies
CREATE POLICY "Clients can update their own appointments" ON appointments
    FOR UPDATE USING (auth.uid() = client_id)
    WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Providers can update their appointments" ON appointments
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM providers WHERE id = provider_id
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM providers WHERE id = provider_id
        )
    );

-- 4. DELETE policies
CREATE POLICY "Clients can delete their own appointments" ON appointments
    FOR DELETE USING (auth.uid() = client_id);

CREATE POLICY "Providers can delete their appointments" ON appointments
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM providers WHERE id = provider_id
        )
    );

-- Ensure RLS is enabled
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;