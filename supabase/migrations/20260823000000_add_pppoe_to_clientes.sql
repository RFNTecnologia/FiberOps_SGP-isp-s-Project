ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS pppoe_usuario TEXT,
  ADD COLUMN IF NOT EXISTS pppoe_senha TEXT;