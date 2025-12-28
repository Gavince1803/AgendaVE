-- Enable RLS on providers table if not already enabled
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all providers
-- This is necessary for clients to see provider details
DROP POLICY IF EXISTS "Providers are viewable by everyone" ON providers;
CREATE POLICY "Providers are viewable by everyone" 
ON providers FOR SELECT 
USING (true);

-- Allow providers to insert/update their own profile
DROP POLICY IF EXISTS "Users can insert their own provider profile" ON providers;
CREATE POLICY "Users can insert their own provider profile" 
ON providers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own provider profile" ON providers;
CREATE POLICY "Users can update their own provider profile" 
ON providers FOR UPDATE 
USING (auth.uid() = user_id);

-- Verify policy creation
SELECT * FROM pg_policies WHERE tablename = 'providers';
