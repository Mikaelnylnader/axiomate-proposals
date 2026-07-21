-- Starter schema for Supabase/Postgres.
-- Convert this into timestamped migrations in the application.
-- Review privileges and policies in the target Supabase project.

create extension if not exists pgcrypto;

create type public.proposal_template_type as enum (
  'warm_intro_trial',
  'signal_lead_system'
);

create type public.proposal_status as enum (
  'draft',
  'published',
  'viewed',
  'accepted',
  'payment_pending',
  'partially_paid',
  'paid',
  'expired',
  'declined',
  'archived',
  'superseded'
);

create type public.payment_choice as enum (
  'none',
  'deposit',
  'full',
  'deposit_or_full'
);

create type public.payment_status as enum (
  'created',
  'pending',
  'succeeded',
  'failed',
  'refunded',
  'partially_refunded'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  contact_email text not null,
  contact_title text,
  address_text text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  proposal_number text not null unique,
  client_id uuid not null references public.clients(id),
  template_type public.proposal_template_type not null,
  title text not null,
  status public.proposal_status not null default 'draft',
  issue_date date not null default current_date,
  valid_until date,
  currency text not null default 'usd'
    check (currency ~ '^[a-z]{3}$'),
  total_amount_minor bigint not null default 0
    check (total_amount_minor >= 0),
  deposit_amount_minor bigint
    check (deposit_amount_minor is null or deposit_amount_minor > 0),
  payment_choice public.payment_choice not null default 'full',
  draft_data jsonb not null default '{}'::jsonb,
  internal_notes text,
  public_token text not null unique default encode(gen_random_bytes(32), 'hex'),
  published_version_id uuid,
  accepted_version_id uuid,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  view_count integer not null default 0 check (view_count >= 0),
  accepted_at timestamptz,
  paid_at timestamptz,
  amount_paid_minor bigint not null default 0 check (amount_paid_minor >= 0),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint valid_deposit check (
    deposit_amount_minor is null
    or deposit_amount_minor < total_amount_minor
  )
);

create table public.proposal_versions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  snapshot jsonb not null,
  snapshot_hash text not null,
  published_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (proposal_id, version_number),
  unique (proposal_id, snapshot_hash)
);

alter table public.proposals
  add constraint proposals_published_version_fk
  foreign key (published_version_id)
  references public.proposal_versions(id);

alter table public.proposals
  add constraint proposals_accepted_version_fk
  foreign key (accepted_version_id)
  references public.proposal_versions(id);

create table public.acceptances (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id),
  proposal_version_id uuid not null references public.proposal_versions(id),
  signer_name text not null,
  signer_email text not null,
  signer_title text,
  consent_text text not null,
  consent_given boolean not null check (consent_given = true),
  accepted_snapshot jsonb not null,
  accepted_snapshot_hash text not null,
  ip_address inet,
  user_agent text,
  accepted_at timestamptz not null default now(),
  unique (proposal_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id),
  acceptance_id uuid references public.acceptances(id),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_customer_id text,
  payment_kind public.payment_choice not null
    check (payment_kind in ('deposit', 'full')),
  currency text not null check (currency ~ '^[a-z]{3}$'),
  expected_amount_minor bigint not null check (expected_amount_minor > 0),
  received_amount_minor bigint not null default 0 check (received_amount_minor >= 0),
  status public.payment_status not null default 'created',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  succeeded_at timestamptz,
  failure_message text
);

create table public.stripe_events (
  stripe_event_id text primary key,
  event_type text not null,
  livemode boolean not null,
  payload jsonb,
  processing_status text not null default 'received'
    check (processing_status in ('received', 'processed', 'ignored', 'failed')),
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index clients_company_name_idx on public.clients (lower(company_name));
create index proposals_status_idx on public.proposals (status);
create index proposals_client_id_idx on public.proposals (client_id);
create index proposals_public_token_idx on public.proposals (public_token);
create index proposal_versions_proposal_id_idx on public.proposal_versions (proposal_id);
create index payments_proposal_id_idx on public.payments (proposal_id);

-- Timestamp helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

create trigger proposals_set_updated_at
before update on public.proposals
for each row execute function public.set_updated_at();

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_versions enable row level security;
alter table public.acceptances enable row level security;
alter table public.payments enable row level security;
alter table public.stripe_events enable row level security;

-- Helper: authenticated admin.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and is_admin = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Profile policies
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

-- Admin policies. Keep anonymous access closed.
create policy "Admins manage clients"
on public.clients for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins manage proposals"
on public.proposals for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins manage proposal versions"
on public.proposal_versions for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins read acceptances"
on public.acceptances for select
to authenticated
using ((select public.is_admin()));

create policy "Admins read payments"
on public.payments for select
to authenticated
using ((select public.is_admin()));

-- No anonymous table policies are intentionally created.
-- Public proposal, acceptance, and Stripe operations must execute in trusted
-- server code using a server-only privileged client after validating the token
-- and requested state transition.

-- Do not grant browser access to stripe_events.
revoke all on public.stripe_events from anon, authenticated;
