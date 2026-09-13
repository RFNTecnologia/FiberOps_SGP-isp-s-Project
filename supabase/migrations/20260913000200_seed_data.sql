insert into public.plans (name, description, price, bandwidth_mbps, status)
values
  ('Fibra 100', 'Plano residencial de 100 Mbps', 89.90, 100, 'active'),
  ('Fibra 300', 'Plano residencial de 300 Mbps', 129.90, 300, 'active'),
  ('Fibra 500', 'Plano residencial de 500 Mbps', 169.90, 500, 'active'),
  ('Empresarial 1 Gbps', 'Plano corporativo para pequenas empresas', 249.90, 1000, 'active')
on conflict do nothing;

insert into public.customers (full_name, document_number, email, phone, address_line, city, state, zip_code, status)
values
  ('Maria da Silva', '12345678901', 'maria.silva@email.com', '(11) 99999-1111', 'Rua das Flores, 123', 'São Paulo', 'SP', '01000-000', 'active'),
  ('João Pereira', '10987654321', 'joao.pereira@email.com', '(11) 98888-2222', 'Av. Paulista, 456', 'São Paulo', 'SP', '01310-100', 'active'),
  ('Ana Costa', '76543210987', 'ana.costa@email.com', '(21) 97777-3333', 'Rua do Porto, 789', 'Rio de Janeiro', 'RJ', '20000-000', 'pending')
on conflict do nothing;

insert into public.services (customer_id, plan_id, service_number, status, contract_start, contract_end, activation_date, address_line, city, state, zip_code)
select c.id, p.id, 'SRV-1001', 'active', '2026-01-15', '2027-01-15', '2026-01-20', c.address_line, c.city, c.state, c.zip_code
from public.customers c
join public.plans p on p.name = 'Fibra 100'
where c.email = 'maria.silva@email.com'
union all
select c.id, p.id, 'SRV-1002', 'active', '2026-02-10', '2027-02-10', '2026-02-15', c.address_line, c.city, c.state, c.zip_code
from public.customers c
join public.plans p on p.name = 'Fibra 300'
where c.email = 'joao.pereira@email.com'
on conflict (service_number) do nothing;

insert into public.invoices (customer_id, service_id, invoice_number, issue_date, due_date, total_amount, status)
select c.id, s.id, 'INV-2026-0001', '2026-09-01', '2026-09-15', 89.90, 'pending'
from public.customers c
join public.services s on s.service_number = 'SRV-1001'
where c.email = 'maria.silva@email.com'
union all
select c.id, s.id, 'INV-2026-0002', '2026-09-01', '2026-09-15', 129.90, 'pending'
from public.customers c
join public.services s on s.service_number = 'SRV-1002'
where c.email = 'joao.pereira@email.com'
on conflict (invoice_number) do nothing;

insert into public.invoice_items (invoice_id, description, quantity, unit_price, total_amount)
select i.id, 'Plano Fibra 100 Mbps', 1, 89.90, 89.90
from public.invoices i
where i.invoice_number = 'INV-2026-0001'
union all
select i.id, 'Plano Fibra 300 Mbps', 1, 129.90, 129.90
from public.invoices i
where i.invoice_number = 'INV-2026-0002'
on conflict do nothing;

insert into public.tickets (customer_id, subject, description, status, priority)
select c.id, 'Internet lenta', 'A conexão está instável na parte da tarde.', 'open', 'medium'
from public.customers c
where c.email = 'maria.silva@email.com'
on conflict do nothing;
