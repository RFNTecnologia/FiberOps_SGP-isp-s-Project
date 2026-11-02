
CREATE TYPE public.equipment_status AS ENUM ('online', 'offline', 'aviso', 'manutencao');
CREATE TYPE public.node_type AS ENUM ('olt', 'ceo', 'cto');

CREATE TABLE public.olts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  modelo TEXT,
  fabricante TEXT,
  ip_gerencia TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  portas_pon INTEGER DEFAULT 8,
  status public.equipment_status NOT NULL DEFAULT 'online',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.caixas_emenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT,
  capacidade_fusoes INTEGER,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  status public.equipment_status NOT NULL DEFAULT 'online',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ctos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  olt_id UUID REFERENCES public.olts(id) ON DELETE SET NULL,
  caixa_emenda_id UUID REFERENCES public.caixas_emenda(id) ON DELETE SET NULL,
  porta_pon INTEGER,
  portas_total INTEGER NOT NULL DEFAULT 16,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  status public.equipment_status NOT NULL DEFAULT 'online',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cto_id UUID REFERENCES public.ctos(id) ON DELETE SET NULL,
  porta_cto INTEGER,
  endereco TEXT,
  telefone TEXT,
  plano TEXT,
  sinal_rx DOUBLE PRECISION,
  status public.equipment_status NOT NULL DEFAULT 'online',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.conexoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origem_tipo public.node_type NOT NULL,
  origem_id UUID NOT NULL,
  destino_tipo public.node_type NOT NULL,
  destino_id UUID NOT NULL,
  cor_fibra TEXT,
  comprimento_metros INTEGER,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grants (v1 open access, no auth yet)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.olts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.caixas_emenda TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ctos TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conexoes TO anon, authenticated;
GRANT ALL ON public.olts, public.caixas_emenda, public.ctos, public.clientes, public.conexoes TO service_role;

ALTER TABLE public.olts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixas_emenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conexoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso_publico_olts" ON public.olts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_ceos" ON public.caixas_emenda FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_ctos" ON public.ctos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_conexoes" ON public.conexoes FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_olts_upd BEFORE UPDATE ON public.olts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ceos_upd BEFORE UPDATE ON public.caixas_emenda FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ctos_upd BEFORE UPDATE ON public.ctos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_clientes_upd BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
