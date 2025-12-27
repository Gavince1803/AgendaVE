-- Create 'banners' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Create 'logos' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access to banners
CREATE POLICY "Public Access Banners"
ON storage.objects FOR SELECT
USING ( bucket_id = 'banners' );

-- Policy: Allow authenticated users to upload banners
CREATE POLICY "Authenticated Users Upload Banners"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'banners'
  AND auth.role() = 'authenticated'
);

-- Policy: Allow users to update/delete their own banners (based on folder name matching user ID)
-- The code uploads as `${user.id}/${filename}`, so the first path segment is the user ID.
CREATE POLICY "Users Update Own Banners"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'banners'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users Delete Own Banners"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'banners'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Rpt for 'logos'
CREATE POLICY "Public Access Logos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'logos' );

CREATE POLICY "Authenticated Users Upload Logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users Update Own Logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users Delete Own Logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
