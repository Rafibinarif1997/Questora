-- BNB HUNTER: run this ONCE in Supabase SQL Editor after deploying the updated scan-wallets function.
-- This schedules a server-side scan every 5 minutes, even when your browser is closed.
-- IMPORTANT: Replace PASTE_SERVICE_ROLE_KEY_HERE locally with your project's service_role JWT.
-- Never commit that key to GitHub or send it in chat.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Store credentials in Supabase Vault (server-side), not in browser code.
select vault.create_secret(
  'https://nhniygxusydosktigyze.supabase.co',
  'bnb_hunter_project_url',
  'BNB HUNTER Supabase project URL'
);

select vault.create_secret(
  'PASTE_SERVICE_ROLE_KEY_HERE',
  'bnb_hunter_service_role_key',
  'BNB HUNTER scheduled scanner authorization'
);

-- Remove an earlier job with the same name, if this setup is being reapplied.
do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'bnb-hunter-scan-every-5-minutes'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'bnb-hunter-scan-every-5-minutes',
    '*/5 * * * *',
    $job$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'bnb_hunter_project_url')
               || '/functions/v1/scan-wallets',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' ||
            (select decrypted_secret from vault.decrypted_secrets where name = 'bnb_hunter_service_role_key')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 10000
      );
    $job$
  );
end $$;

-- Verify the schedule exists:
select jobid, jobname, schedule, active
from cron.job
where jobname = 'bnb-hunter-scan-every-5-minutes';
