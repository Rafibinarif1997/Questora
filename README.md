# RHOOD FORGE — Launchpad Frontend

A polished, responsive multi-page launchpad starter for GitHub Pages. Each major page has its own URL that does not end in `index`:

- `/discover.html`
- `/launches.html`
- `/create.html`
- `/token.html?token=HSIG`
- `/trade.html`
- `/portfolio.html`
- `/rankings.html`
- `/guilds.html`
- `/vesting.html`
- `/airdrop.html`
- `/activity.html`
- `/profile.html`
- `/settings.html`
- `/docs.html`

## Deploy on GitHub Pages
1. Extract the ZIP.
2. Upload **all contents** to the root of your GitHub repository, preserving the `assets/` folder.
3. Commit to the branch/folder configured for GitHub Pages.
4. Open your domain root, then use the separate `.html` URLs above.

## Network reference
Robinhood Chain Testnet · Chain ID `46630` (`0xb626`) · RPC `https://rpc.testnet.chain.robinhood.com` · Explorer `https://explorer.testnet.chain.robinhood.com`.

## Important production status
This is a complete frontend starter / interactive UI prototype, not a production-ready live launchpad. Demo tokens, rankings, prices, volume, chart and guild metrics are illustrative. Wallet connection and native balance reading work with a compatible injected EVM wallet. Token deployment, swaps, claims, vesting transactions and live indexed data remain disabled until the matching audited contracts and backend/indexer are configured.

Before production, implement and audit:
- Token factory + bonding curve, fees, graduation/migration and DEX integration.
- Server-side transaction validation and secure contract configuration.
- Injected EVM wallet connection is included. It requests accounts, offers to switch/add Robinhood Chain Testnet (chain ID 46630), and reads the connected wallet's native ETH balance.
- Supabase Auth/database policies and backend validation for profiles, guilds, invites, referrals and campaign claims.
- A trusted chain indexer for prices, holders, trades, ranking and activity.
- Transaction simulation, slippage protection, anti-bot controls, monitoring and independent security review.

Do not put private keys, OAuth client secrets, or Supabase service-role keys in public files.
