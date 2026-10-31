# BNB HUNTER

An isolated BNB Smart Chain NFT discovery dashboard added alongside the existing Questora/RHOOD Forge project.

## Current phase
- Dashboard with private per-user wallet watchlist and bulk wallet import.
- Manual scanner control in the dashboard.
- Read-only BNB Chain NFT mint detection for ERC-721 Transfer and ERC-1155 TransferSingle/TransferBatch events where the tracked wallet is the mint recipient.
- No wallet signing, approvals, swaps, or transaction execution.

## Setup
1. Run `supabase/schema.sql` in the existing Supabase project's SQL Editor.
2. Set the project URL and publishable/anon key in `config.js`.
3. Deploy the Edge Function in `supabase/functions/scan-wallets/index.ts` to the existing Supabase project using the function name `scan-wallets`.
4. The function uses the Supabase Edge Function runtime's `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` server-side environment variables. Do not put the service-role key in browser code or GitHub.
5. Optional: set `BSC_RPC_URL` as an Edge Function secret to a reliable BNB Smart Chain RPC endpoint. If omitted, the function uses the public BSC dataseed endpoint.
6. Sign in to the dashboard and press **Scan wallets now**.

## Scanner behavior
- The first manual scan checks the latest 1,000 BNB Chain blocks for mint-to-watchlist events.
- Each successful subsequent scan continues from the last successful block checkpoint, scanning the next 1,000 blocks.
- Enabled wallets are processed in groups of 40; event rows are written server-side with the service role and deduplicated by owner, transaction, NFT contract, and token ID.
- This is an on-demand scanner at this stage. It does not run continuously until a scheduled invocation is configured.
- It detects NFT mints received by tracked wallets, not every new token launch or every NFT collection deployed on BNB Chain.

## Security
- Never put a Supabase service_role key, wallet private key, or seed phrase in this folder.
- The browser uses only the publishable/anon key and Supabase Auth.
- The scanner validates the signed-in user and reads/writes only that user's watchlist and scan records.
- All wallet activity is monitoring-only.
