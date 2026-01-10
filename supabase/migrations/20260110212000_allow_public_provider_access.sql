-- Allow public read access to providers
DROP POLICY IF EXISTS "Public providers are viewable by everyone" ON providers;
CREATE POLICY "Public providers are viewable by everyone"
  ON providers FOR SELECT
  USING (true);

-- Allow public read access to services
DROP POLICY IF EXISTS "Services are viewable by everyone" ON services;
CREATE POLICY "Services are viewable by everyone"
  ON services FOR SELECT
  USING (true);

-- Allow public read access to availabilities (plural)
DROP POLICY IF EXISTS "Availability is viewable by everyone" ON availabilities;
CREATE POLICY "Availability is viewable by everyone"
  ON availabilities FOR SELECT
  USING (true);

-- Allow public read access to provider media
DROP POLICY IF EXISTS "Media is viewable by everyone" ON provider_media;
CREATE POLICY "Media is viewable by everyone"
  ON provider_media FOR SELECT
  USING (true);

-- Allow public read access to reviews
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

-- Allow public read access to provider highlights
DROP POLICY IF EXISTS "Highlights are viewable by everyone" ON provider_highlights;
CREATE POLICY "Highlights are viewable by everyone"
  ON provider_highlights FOR SELECT
  USING (true);

-- Allow public read access to provider team members
DROP POLICY IF EXISTS "Team members are viewable by everyone" ON provider_team_members;
CREATE POLICY "Team members are viewable by everyone"
  ON provider_team_members FOR SELECT
  USING (true);
