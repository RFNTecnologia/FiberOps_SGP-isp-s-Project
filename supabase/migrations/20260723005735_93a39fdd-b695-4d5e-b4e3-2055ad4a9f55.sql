
-- Replace permissive ALL policies with public SELECT + authenticated writes
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['olts','caixas_emenda','ctos','clientes','conexoes'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS acesso_publico_%s ON public.%I', 
      CASE t WHEN 'caixas_emenda' THEN 'ceos' ELSE t END, t);
  END LOOP;
END $$;

-- Public read
CREATE POLICY "public_read_olts" ON public.olts FOR SELECT USING (true);
CREATE POLICY "public_read_ceos" ON public.caixas_emenda FOR SELECT USING (true);
CREATE POLICY "public_read_ctos" ON public.ctos FOR SELECT USING (true);
CREATE POLICY "public_read_clientes" ON public.clientes FOR SELECT USING (true);
CREATE POLICY "public_read_conexoes" ON public.conexoes FOR SELECT USING (true);

-- Authenticated writes
CREATE POLICY "auth_write_olts" ON public.olts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_olts" ON public.olts FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_olts" ON public.olts FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_write_ceos" ON public.caixas_emenda FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_ceos" ON public.caixas_emenda FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_ceos" ON public.caixas_emenda FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_write_ctos" ON public.ctos FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_ctos" ON public.ctos FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_ctos" ON public.ctos FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_write_clientes" ON public.clientes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_clientes" ON public.clientes FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_clientes" ON public.clientes FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_write_conexoes" ON public.conexoes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_conexoes" ON public.conexoes FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_conexoes" ON public.conexoes FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
