
CREATE POLICY "audio public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio');

CREATE POLICY "audio public insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'audio');

CREATE POLICY "audio public update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'audio');

CREATE POLICY "audio public delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'audio');
