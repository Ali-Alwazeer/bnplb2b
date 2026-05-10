-- =========================
-- ENUMS
-- =========================
create type public.app_role as enum ('merchant','buyer','credit','legal','admin');

create type public.application_type as enum ('merchant','buyer');

create type public.application_status as enum (
  'draft',
  'submitted',
  'credit_review',
  'legal_review',
  'contract_pending',
  'onboarded',
  'rejected'
);

create type public.document_kind as enum (
  'commercial_registration',
  'poa_or_id',
  'vat_certificate',
  'national_address',
  'iban_letter',
  'sales_ledger_6mo',
  'owner_bank_6mo',
  'company_bank_2yr',
  'vat_returns_1yr'
);

-- =========================
-- PROFILES
-- =========================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  company_name text,
  preferred_lang text not null default 'en' check (preferred_lang in ('en','ar')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

-- =========================
-- USER ROLES
-- =========================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users view own roles"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create policy "Admins manage roles"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- =========================
-- APPLICATIONS
-- =========================
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.application_type not null,
  status public.application_status not null default 'draft',
  company_name text,
  manager_email text,
  manager_phone text,
  expected_monthly_volume numeric,
  assigned_limit numeric,
  contract_signed boolean not null default false,
  guarantee_approved boolean not null default false,
  review_notes text,
  submitted_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_user_id_idx on public.applications(user_id);
create index applications_status_idx on public.applications(status);
create index applications_type_idx on public.applications(type);

alter table public.applications enable row level security;

-- Owner can read/write their own application
create policy "Owners read own application"
  on public.applications for select to authenticated
  using (auth.uid() = user_id);

create policy "Owners insert own application"
  on public.applications for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Owners update own draft application"
  on public.applications for update to authenticated
  using (auth.uid() = user_id and status = 'draft')
  with check (auth.uid() = user_id);

-- Credit team: read/update buyer applications
create policy "Credit reads buyer applications"
  on public.applications for select to authenticated
  using (public.has_role(auth.uid(),'credit') and type = 'buyer');

create policy "Credit updates buyer applications"
  on public.applications for update to authenticated
  using (public.has_role(auth.uid(),'credit') and type = 'buyer');

-- Legal team: read/update all
create policy "Legal reads all applications"
  on public.applications for select to authenticated
  using (public.has_role(auth.uid(),'legal'));

create policy "Legal updates all applications"
  on public.applications for update to authenticated
  using (public.has_role(auth.uid(),'legal'));

-- Admin: full
create policy "Admin full applications"
  on public.applications for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- =========================
-- DOCUMENTS
-- =========================
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  kind public.document_kind not null,
  file_path text not null,
  file_name text,
  uploaded_at timestamptz not null default now()
);

create index documents_application_id_idx on public.documents(application_id);

alter table public.documents enable row level security;

create policy "Owners read own documents"
  on public.documents for select to authenticated
  using (exists (select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid()));

create policy "Owners insert own documents"
  on public.documents for insert to authenticated
  with check (exists (select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid() and a.status = 'draft'));

create policy "Owners delete own draft documents"
  on public.documents for delete to authenticated
  using (exists (select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid() and a.status = 'draft'));

create policy "Credit reads buyer documents"
  on public.documents for select to authenticated
  using (public.has_role(auth.uid(),'credit') and exists (select 1 from public.applications a where a.id = application_id and a.type='buyer'));

create policy "Legal reads all documents"
  on public.documents for select to authenticated
  using (public.has_role(auth.uid(),'legal'));

create policy "Admin manages documents"
  on public.documents for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- =========================
-- TIMESTAMP TRIGGERS
-- =========================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger applications_touch before update on public.applications
  for each row execute function public.touch_updated_at();

-- =========================
-- AUTO PROFILE + ROLE ON SIGNUP
-- =========================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role;
begin
  insert into public.profiles (id, full_name, phone, company_name, preferred_lang)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'phone',''),
    coalesce(new.raw_user_meta_data->>'company_name',''),
    coalesce(new.raw_user_meta_data->>'preferred_lang','en')
  );

  v_role := coalesce(nullif(new.raw_user_meta_data->>'role','')::public.app_role, 'buyer');

  -- Only allow self-assigning merchant/buyer at signup. Admin/credit/legal must be granted manually.
  if v_role in ('merchant','buyer') then
    insert into public.user_roles(user_id, role) values (new.id, v_role)
    on conflict do nothing;
  else
    insert into public.user_roles(user_id, role) values (new.id, 'buyer')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================
-- STORAGE BUCKET
-- =========================
insert into storage.buckets (id, name, public)
values ('kyc-documents','kyc-documents', false)
on conflict (id) do nothing;

-- Storage policies. Path convention: {user_id}/{application_id}/{filename}
create policy "Users upload own kyc"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users read own kyc"
  on storage.objects for select to authenticated
  using (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own kyc"
  on storage.objects for delete to authenticated
  using (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Reviewers read kyc"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'kyc-documents' and (
      public.has_role(auth.uid(),'credit') or
      public.has_role(auth.uid(),'legal') or
      public.has_role(auth.uid(),'admin')
    )
  );
