-- Fix RLS policies for availabilities table
-- Run this in your Supabase SQL Editor

-- First, check if RLS is enabled on availabilities table
-- SELECT * FROM pg_tables WHERE schemaname = 'public' AND tablename = 'availabilities';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own provider availabilities" ON availabilities;
DROP POLICY IF EXISTS "Users can view their own provider availabilities" ON availabilities;
DROP POLICY IF EXISTS "Providers can manage their availabilities" ON availabilities;

-- Create new policies for availabilities table
-- Policy for providers to manage their own availabilities
CREATE POLICY "Providers can manage their availabilities" ON availabilities
  FOR ALL USING (
    provider_id IN (
      SELECT id FROM providers WHERE owner_id = auth.uid()
    )
  );

-- Policy for viewing availabilities (both providers and clients can see them)
CREATE POLICY "Anyone can view availabilities" ON availabilities
  FOR SELECT USING (true);

-- If RLS is not enabled, enable it
ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;

-- Also check and fix services table policies
DROP POLICY IF EXISTS "Providers can manage their services" ON services;
CREATE POLICY "Providers can manage their services" ON services
  FOR ALL USING (
    provider_id IN (
      SELECT id FROM providers WHERE owner_id = auth.uid()
    )
  );

-- Policy for viewing services (anyone can see them)
DROP POLICY IF EXISTS "Anyone can view services" ON services;
CREATE POLICY "Anyone can view services" ON services
  FOR SELECT USING (true);

-- Ensure RLS is enabled on services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Check providers table policies too
DROP POLICY IF EXISTS "Users can manage their provider profile" ON providers;
CREATE POLICY "Users can manage their provider profile" ON providers
  FOR ALL USING (owner_id = auth.uid());

-- Policy for viewing providers (anyone can see them)
DROP POLICY IF EXISTS "Anyone can view providers" ON providers;
CREATE POLICY "Anyone can view providers" ON providers
  FOR SELECT USING (true);

-- Ensure RLS is enabled on providers
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Optional: Add some debugging info
-- You can run this to check what user ID is being used:
-- SELECT auth.uid() as current_user_id;

-- You can run this to check your provider record:
-- SELECT id, owner_id, business_name FROM providers WHERE owner_id = auth.uid();