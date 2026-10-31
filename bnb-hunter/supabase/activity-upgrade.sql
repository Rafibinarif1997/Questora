-- BNB HUNTER activity feed upgrade: ERC-20 token mints + enriched NFT activity.
-- Safe additive migration: preserves all existing wallet addresses and scan history.

create table if not exists public.hunter_activity_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid references public.hunter_wallets(id) on delete set null,
  chain_id bigint not null default 56,
  activity_type text not null check (activity_type in ('erc20_mint','erc721_mint','erc1155_mint')),
  contract_address text not null,
  wallet_address text not null,
  token_id numeric(78,0),
  amount numeric(78,0),
  token_name text,
  token_symbol text,
  token_decimals integer,
  tx_hash text not null,
  block_number bigint not null,
  project_name text,
  project_url text,
  contract_url text,
  transaction_url text,
  detected_at timestamptz not null default now(),
  unique(owner_id, tx_hash, contract_address, activity_type, token_id)
);

create index if not exists hunter_activity_owner_time_idx
  on public.hunter_activity_events(owner_id, detected_at desc);
create index if not exists hunter_activity_owner_block_idx
  on public.hunter_activity_events(owner_id, block_number desc);

alter table public.hunter_activity_events enable row level security;
drop policy if exists "Owners read their hunter activity events" on public.hunter_activity_events;
create policy "Owners read their hunter activity events"
  on public.hunter_activity_events for select to authenticated
  using (owner_id = auth.uid());
grant select on public.hunter_activity_events to authenticated;

-- Ensure the five-minute job sends the dedicated scheduler secret header.
-- The value in Vault must match the BNB_HUNTER_CRON_SECRET Edge Function secret.
do $$
declare existing_job_id bigint;
begin
  select jobid into existing_job_id from cron.job
  where jobname = 'bnb-hunter-scan-every-5-minutes' limit 1;
  if existing_job_id is not null then perform cron.unschedule(existing_job_id); end if;

  perform cron.schedule(
    'bnb-hunter-scan-every-5-minutes',
    '*/5 * * * *',
    $job$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'bnb_hunter_project_url')
               || '/functions/v1/scan-wallets',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'bnb_hunter_service_role_key')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 10000
      );
    $job$
  );
end $$;

select jobid, jobname, schedule, active
from cron.job
where jobname = 'bnb-hunter-scan-every-5-minutes';
