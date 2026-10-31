-- BNB HUNTER tables. Isolated from existing RHOOD FORGE tables.
-- Run this in Supabase SQL Editor after confirming the intended project.
create extension if not exists pgcrypto;

create table if not exists public.hunter_wallets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  address text not null check (address ~* '^0x[a-f0-9]{40}$'),
  label text not null default '',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique(owner_id, address)
);

create index if not exists hunter_wallets_owner_enabled_idx
  on public.hunter_wallets(owner_id, enabled);

create table if not exists public.hunter_mint_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid references public.hunter_wallets(id) on delete set null,
  chain_id bigint not null default 56,
  nft_contract text not null,
  minter_address text not null,
  token_id numeric(78,0),
  tx_hash text not null,
  block_number bigint not null,
  event_kind text not null default 'erc721_mint',
  detected_at timestamptz not null default now(),
  unique(owner_id, tx_hash, nft_contract, token_id)
);

create index if not exists hunter_mint_events_owner_time_idx
  on public.hunter_mint_events(owner_id, detected_at desc);

create table if not exists public.hunter_scan_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('running','success','partial','failed')),
  wallets_checked integer not null default 0,
  events_found integer not null default 0,
  from_block bigint,
  to_block bigint,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists hunter_scan_runs_owner_time_idx
  on public.hunter_scan_runs(owner_id, started_at desc);

create table if not exists public.hunter_opportunities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  mint_event_id uuid references public.hunter_mint_events(id) on delete cascade,
  project_name text,
  mint_url text,
  contract_address text,
  mint_price_wei numeric(78,0),
  risk_score integer check (risk_score between 0 and 100),
  ai_summary text,
  status text not null default 'review' check (status in ('review','approved','dismissed')),
  created_at timestamptz not null default now()
);

alter table public.hunter_wallets enable row level security;
alter table public.hunter_mint_events enable row level security;
alter table public.hunter_scan_runs enable row level security;
alter table public.hunter_opportunities enable row level security;

drop policy if exists "Owners manage their hunter wallets" on public.hunter_wallets;
create policy "Owners manage their hunter wallets"
  on public.hunter_wallets for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Owners read their hunter mint events" on public.hunter_mint_events;
create policy "Owners read their hunter mint events"
  on public.hunter_mint_events for select to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Owners read their hunter scan runs" on public.hunter_scan_runs;
create policy "Owners read their hunter scan runs"
  on public.hunter_scan_runs for select to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Owners read their hunter opportunities" on public.hunter_opportunities;
create policy "Owners read their hunter opportunities"
  on public.hunter_opportunities for select to authenticated
  using (owner_id = auth.uid());

grant select, insert, update, delete on public.hunter_wallets to authenticated;
grant select on public.hunter_mint_events, public.hunter_scan_runs, public.hunter_opportunities to authenticated;

-- Writes to events, scan runs and opportunities are reserved for trusted
-- server-side Edge Functions using the Supabase service role.
