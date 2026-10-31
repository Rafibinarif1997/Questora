# BNB HUNTER

An isolated BNB Smart Chain NFT discovery dashboard added alongside the existing Questora/RHOOD Forge project.

## Current phase
- Private per-user wallet watchlist with bulk import.
- Manual scanner control in the dashboard.
- Optional server-side scheduled scan every 5 minutes.
- Read-only BNB Chain NFT mint detection for ERC-721 Transfer and ERC-1155 TransferSingle/TransferBatch events where a tracked wallet is the mint recipient.
- No wallet signing, approvals, swaps, or transaction execution.

## Setup
1. Run `supabase/schema.sql` in the existing Supabase project's SQL Editor.
2. Set the project URL and publishable/anon key in `config.js`.
3. Deploy `supabase/functions/scan-wallets/index.ts` to the existing Supabase project using the function name `scan-wallets`.
4. The function uses the Supabase Edge Function runtime's `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` server-side environment variables. Do not put the service-role key in browser code or GitHub.
5. Optional: set `BSC_RPC_URL` as an Edge Function secret to a reliable BNB Smart Chain RPC endpoint. If omitted, the function uses the public BSC dataseed endpoint.
6. Sign in to the dashboard and press **Scan wallets now** for a manual scan.

## Enable automatic scans every 5 minutes
1. Deploy the latest `scan-wallets` function. It supports both a signed-in user's manual scan and a server-authorized scheduled scan across all users' enabled wallets.
2. Open Supabase Dashboard → Project Settings → API, and copy the **service_role** key. Never share it or put it in GitHub/browser code.
3. Open `supabase/schedule.sql` from this folder. Replace `PASTE_SERVICE_ROLE_KEY_HERE` with the service_role key locally. Do not commit this edited SQL file.
4. Paste the edited SQL into Supabase → SQL Editor and run it once. It stores the project URL and key in Supabase Vault, then creates a Cron job named `bnb-hunter-scan-every-5-minutes`.
5. The final query in the SQL should show the job as active. Check Supabase → Cron / Logs after the next 5-minute interval to verify invocations.
6. The scheduled function uses the service-role JWT only for server-to-server authorization. The browser still uses the publishable key and normal user session.

If the Vault secret names already exist from a previous attempt, do not blindly rerun the two `vault.create_secret` statements; update the existing Vault secrets or remove/rename the old ones first to avoid duplicate names.

## Scanner behavior and limits
- A user's first scan checks the latest 1,000 BNB Chain blocks. Later scans continue from the last successful block checkpoint.
- The scheduled invocation scans all owners who have at least one enabled watchlist wallet. It keeps a separate checkpoint per owner.
- Enabled wallets are processed in groups of 40; event rows are written server-side and deduplicated by owner, transaction, NFT contract, and token ID.
- The schedule runs every 5 minutes, but detection can be delayed by RPC provider latency, function runtime limits, or a failed Cron invocation. Use a reliable BSC RPC provider for larger watchlists.
- This detects NFT mints received by tracked wallets, not every new token launch or every NFT collection deployed on BNB Chain.
- The first scan is not a historical scan. It does not search a wallet's entire past activity.

## Security
- Never put a Supabase service_role key, wallet private key, or seed phrase in this folder.
- The browser uses only the publishable/anon key and Supabase Auth.
- Scheduled authorization secret is stored in Supabase Vault, not the website.
- All wallet activity is monitoring-only.
