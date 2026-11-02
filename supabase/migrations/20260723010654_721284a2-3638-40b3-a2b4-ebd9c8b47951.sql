
CREATE POLICY "OS evidencias leitura publica" ON storage.objects
  FOR SELECT USING (bucket_id = 'os-evidencias');
CREATE POLICY "OS evidencias upload autenticado" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'os-evidencias');
CREATE POLICY "OS evidencias update autenticado" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'os-evidencias');
CREATE POLICY "OS evidencias delete autenticado" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'os-evidencias');
