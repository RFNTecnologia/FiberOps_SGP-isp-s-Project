
CREATE TABLE public.ordens_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero bigserial NOT NULL UNIQUE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  tipo text NOT NULL DEFAULT 'instalacao',
  prioridade text NOT NULL DEFAULT 'media',
  status text NOT NULL DEFAULT 'aberta',
  tecnico text,
  data_agendada timestamptz,
  descricao text,
  endereco text,
  latitude double precision,
  longitude double precision,
  equipamento_tipo text,
  equipamento_id uuid,
  notas jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidencias jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ordens_servico TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordens_servico TO authenticated;
GRANT ALL ON public.ordens_servico TO service_role;

ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "OS visíveis a todos" ON public.ordens_servico FOR SELECT USING (true);
CREATE POLICY "Autenticados criam OS" ON public.ordens_servico FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados editam OS" ON public.ordens_servico FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Autenticados removem OS" ON public.ordens_servico FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_ordens_servico_updated_at
  BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX ordens_servico_status_idx ON public.ordens_servico (status);
CREATE INDEX ordens_servico_cliente_idx ON public.ordens_servico (cliente_id);
