create extension if not exists pgcrypto;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  role text not null default 'customer' check (role in ('admin', 'support', 'technician', 'customer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  document_number text,
  email text,
  phone text,
  address_line text,
  city text,
  state text,
  zip_code text,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  bandwidth_mbps integer not null default 0 check (bandwidth_mbps >= 0),
  status text not null default 'active' check (status in ('active', 'inactive', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  service_number text not null unique,
  status text not null default 'pending' check (status in ('pending', 'active', 'paused', 'cancelled')),
  contract_start date,
  contract_end date,
  activation_date date,
  address_line text,
  city text,
  state text,
  zip_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.installations (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null unique references public.services(id) on delete cascade,
  technician_id uuid references public.profiles(id) on delete set null,
  installation_date timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'failed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  invoice_number text not null unique,
  issue_date date not null default current_date,
  due_date date not null,
  total_amount numeric(12,2) not null check (total_amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'overdue', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  subject text not null,
  description text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'pending', 'resolved', 'closed')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.handle_updated_at();

create trigger trg_customers_updated_at
before update on public.customers
for each row execute procedure public.handle_updated_at();

create trigger trg_plans_updated_at
before update on public.plans
for each row execute procedure public.handle_updated_at();

create trigger trg_services_updated_at
before update on public.services
for each row execute procedure public.handle_updated_at();

create trigger trg_installations_updated_at
before update on public.installations
for each row execute procedure public.handle_updated_at();

create trigger trg_invoices_updated_at
before update on public.invoices
for each row execute procedure public.handle_updated_at();

create trigger trg_tickets_updated_at
before update on public.tickets
for each row execute procedure public.handle_updated_at();

create index if not exists idx_customers_profile_id on public.customers(profile_id);
create index if not exists idx_customers_email on public.customers(email);
create index if not exists idx_services_customer_id on public.services(customer_id);
create index if not exists idx_services_plan_id on public.services(plan_id);
create index if not exists idx_installations_service_id on public.installations(service_id);
create index if not exists idx_invoices_customer_id on public.invoices(customer_id);
create index if not exists idx_invoice_items_invoice_id on public.invoice_items(invoice_id);
create index if not exists idx_tickets_customer_id on public.tickets(customer_id);
create index if not exists idx_ticket_messages_ticket_id on public.ticket_messages(ticket_id);

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.plans enable row level security;
alter table public.services enable row level security;
alter table public.installations enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;

create policy "profiles_are_viewable_by_own_user"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_are_updatable_by_own_user"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "customers_are_viewable_by_owner"
on public.customers
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.role in ('admin', 'support', 'technician') or p.id = customers.profile_id)
  )
);

create policy "customers_are_manageable_by_admins"
on public.customers
for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'support')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'support')
  )
);

create policy "plans_are_readable_by_authenticated_users"
on public.plans
for select
using (auth.role() = 'authenticated');

create policy "plans_are_manageable_by_admins"
on public.plans
for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "services_are_viewable_by_related_users"
on public.services
for select
using (
  exists (
    select 1
    from public.customers c
    left join public.profiles p on p.id = auth.uid()
    where c.id = services.customer_id
      and (
        p.role in ('admin', 'support', 'technician') or c.profile_id = auth.uid()
      )
  )
);

create policy "services_are_manageable_by_admins"
on public.services
for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'support')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'support')
  )
);

create policy "invoices_are_viewable_by_related_users"
on public.invoices
for select
using (
  exists (
    select 1
    from public.customers c
    left join public.profiles p on p.id = auth.uid()
    where c.id = invoices.customer_id
      and (
        p.role in ('admin', 'support') or c.profile_id = auth.uid()
      )
  )
);

create policy "invoices_are_manageable_by_admins"
on public.invoices
for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'support')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'support')
  )
);

create policy "tickets_are_viewable_by_owners_or_staff"
on public.tickets
for select
using (
  exists (
    select 1
    from public.customers c
    left join public.profiles p on p.id = auth.uid()
    where c.id = tickets.customer_id
      and (
        p.role in ('admin', 'support', 'technician') or c.profile_id = auth.uid()
      )
  )
);

create policy "tickets_are_manageable_by_staff"
on public.tickets
for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'support', 'technician')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'support', 'technician')
  )
);

create policy "ticket_messages_are_viewable_by_related_users"
on public.ticket_messages
for select
using (
  exists (
    select 1
    from public.tickets t
    join public.customers c on c.id = t.customer_id
    join public.profiles p on p.id = auth.uid()
    where t.id = ticket_messages.ticket_id
      and (p.role in ('admin', 'support', 'technician') or c.profile_id = auth.uid())
  )
);

create policy "ticket_messages_are_manageable_by_staff"
on public.ticket_messages
for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'support', 'technician')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'support', 'technician')
  )
);
