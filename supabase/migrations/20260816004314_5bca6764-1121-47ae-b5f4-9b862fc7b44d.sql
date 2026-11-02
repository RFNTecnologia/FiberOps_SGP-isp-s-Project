
CREATE TABLE public.rbs (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    fabricante text,
    modelo text,
    ip_gerencia text,
    latitude double precision not null,
    longitude double precision not null,
    status public.equipment_status default 'online',
    observacoes text,
    created_at timestamptz default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rbs TO authenticated;
GRANT SELECT ON public.rbs TO anon;
GRANT ALL ON public.rbs TO service_role;
ALTER TABLE public.rbs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated" ON public.rbs FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable read for all" ON public.rbs FOR SELECT TO public USING (true);

CREATE TABLE public.onus (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    cto_id uuid references public.ctos(id) on delete set null,
    porta_cto integer,
    mac text,
    sn text,
    latitude double precision not null,
    longitude double precision not null,
    status public.equipment_status default 'online',
    observacoes text,
    created_at timestamptz default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onus TO authenticated;
GRANT SELECT ON public.onus TO anon;
GRANT ALL ON public.onus TO service_role;
ALTER TABLE public.onus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated" ON public.onus FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable read for all" ON public.onus FOR SELECT TO public USING (true);
