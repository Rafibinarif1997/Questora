-- RHOOD FORGE public discovery/indexer schema.
-- Writes should be performed by a trusted indexer using the Supabase service role.
-- Never expose the service-role key in browser code.

create extension if not exists pgcrypto;

create table if not exists public.launches (
  id uuid primary key default gen_random_uuid(),
  chain_id bigint not null,
  token_address text not null,
  curve_address text not null,
  creator_address text not null,
  team_recipient text not null,
  airdrop_recipient text not null,
  token_name text not null,
  token_symbol text not null,
  total_supply numeric(78,0) not null,
  curve_allocation numeric(78,0) not null,
  team_allocation numeric(78,0) not null,
  airdrop_allocation numeric(78,0) not null,
  metadata_uri text,
  launch_tx_hash text not null,
  launch_block bigint not null,
  status text not null default 'bonding' check (status in ('bonding','graduation_ready','graduated','paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chain_id, token_address),
  unique (chain_id, launch_tx_hash)
);

create index if not exists launches_created_at_idx on public.launches (created_at desc);
create index if not exists launches_creator_idx on public.launches (lower(creator_address));
create index if not exists launches_status_idx on public.launches (status);

create table if not exists public.trade_events (
  id bigserial primary key,
  chain_id bigint not null,
  token_address text not null,
  curve_address text not null,
  trader_address text not null,
  side text not null check (side in ('buy','sell')),
  eth_amount_wei numeric(78,0) not null,
  token_amount_wei numeric(78,0) not null,
  fee_wei numeric(78,0) not null default 0,
  tx_hash text not null,
  log_index integer not null,
  block_number bigint not null,
  block_timestamp timestamptz not null,
  created_at timestamptz not null default now(),
  unique (chain_id, tx_hash, log_index)
);

create index if not exists trade_events_token_time_idx
  on public.trade_events (chain_id, lower(token_address), block_timestamp desc);
create index if not exists trade_events_trader_idx
  on public.trade_events (chain_id, lower(trader_address), block_timestamp desc);

create table if not exists public.token_candles (
  chain_id bigint not null,
  token_address text not null,
  bucket timestamptz not null,
  interval text not null check (interval in ('1m','5m','15m','1h','4h','1d')),
  open_price numeric(78,36) not null,
  high_price numeric(78,36) not null,
  low_price numeric(78,36) not null,
  close_price numeric(78,36) not null,
  volume_eth_wei numeric(78,0) not null default 0,
  trade_count integer not null default 0,
  primary key (chain_id, token_address, interval, bucket)
);

create index if not exists token_candles_lookup_idx
  on public.token_candles (chain_id, lower(token_address), interval, bucket desc);

alter table public.launches enable row level security;
alter table public.trade_events enable row level security;
alter table public.token_candles enable row level security;

-- Public discovery reads. No client-side write policies are granted.
drop policy if exists "Public can read launches" on public.launches;
create policy "Public can read launches"
  on public.launches for select to anon, authenticated using (true);

drop policy if exists "Public can read trade events" on public.trade_events;
create policy "Public can read trade events"
  on public.trade_events for select to anon, authenticated using (true);

drop policy if exists "Public can read candles" on public.token_candles;
create policy "Public can read candles"
  on public.token_candles for select to anon, authenticated using (true);

grant select on public.launches, public.trade_events, public.token_candles to anon, authenticated;
