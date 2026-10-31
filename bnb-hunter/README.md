# BNB HUNTER

An isolated BNB Smart Chain NFT discovery dashboard added alongside the existing Questora/RHOOD Forge project.

## Current phase
- Dashboard shell and configuration placeholder.
- Private per-user wallet watchlist schema.
- Read-only discovery architecture; no wallet signing or transaction execution.
- No real scan data is displayed until the Supabase project and scanner provider are configured.

## Setup
1. Confirm the correct existing Supabase project.
2. Run `supabase/schema.sql` in that project's SQL Editor.
3. Copy the Supabase Project URL and publishable/anon key into `config.js`.
4. Open the GitHub Pages route: `/Questora/bnb-hunter/`.

## Security
- Never put a Supabase service_role key, wallet private key, or seed phrase in this folder.
- The browser uses only the publishable/anon key and Supabase Auth.
- Server-side scanning will use Supabase Edge Functions and server-side secrets.
- All wallet activity is monitoring-only. Minting, approvals, swaps, and signing are disabled.

## Scanner status
The scanner is not active yet. Before enabling it, select a BNB Chain RPC/indexer that supports historical event logs, define rate limits and scan checkpoints, and deploy the Edge Function plus scheduled job.
