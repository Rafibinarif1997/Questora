# RHOOD Forge — GitHub Pages root

Red/black VibeVibe-inspired launchpad UI for Robinhood Chain Testnet. This is a static GitHub Pages site; put the contents of this folder directly in the repository's `main` branch root.

## Included now
- Responsive launchpad UI: Explore, Launch Token, tokenomics, lifecycle.
- Injected EVM wallet connect and Robinhood Chain Testnet network switching.
- Testnet details: chain ID `46630` (`0xb626`), ETH gas, RPC `https://rpc.testnet.chain.robinhood.com`, explorer `https://explorer.testnet.chain.robinhood.com`.
- Safe fail-closed launch form: does not pretend to create a token or send transactions when contracts are absent.
- Config file with explicit contract slots.

## Important: not yet a live launchpad
No contract address or ABI was supplied. Therefore token creation, bonding-curve buys/sells, token discovery/indexing, team vesting, Merkle airdrops and Uniswap V4 graduation are not enabled. The UI deliberately does not send transactions against unknown contracts.

## Required contracts / integration points
1. **Launchpad Factory** — creates a token + per-token curve/pool state, emits a canonical `TokenCreated` event, applies the 500,000,000 max supply and prevents further minting.
2. **Bonding Curve / Trading Router** — quote/buy/sell methods, slippage/deadline handling, reserves and fee accounting, curve allocation 400,000,000 tokens (80%).
3. **Team Vesting** — 50,000,000 tokens (10%), 12-month vesting with a 6-month cliff.
4. **Merkle Airdrop** — 50,000,000 tokens (10%), merkle root setup and claim method.
5. **Graduation Manager / Uniswap V4 integration** — graduation threshold, pool initialization, liquidity position creation, approvals and event emission. Verify exact Robinhood Testnet Uniswap V4 deployments and ABIs before setting addresses.
6. **Indexer / listing source** — listen for factory token creation and curve/graduation events, or query explorer/indexer APIs; GitHub Pages alone cannot run a private backend or securely hold secrets.

### Previously chosen tokenomics
- Maximum supply: 500,000,000 fixed; no additional minting.
- Bonding curve: 80% / 400,000,000.
- Team: 10% / 50,000,000; 12-month vesting, 6-month cliff.
- Merkle airdrop: 10% / 50,000,000.
- Intended lifecycle: create → bonding curve → trade → graduate → Uniswap V4.

## Configure
Edit `config.js` after the contracts have been deployed and verified. Add addresses and verified ABI JSON. Do not put private keys, seed phrases, service-role keys, or other secrets in the static site.

The current UI intentionally leaves transaction-writing disabled until the factory ABI and exact method signatures are implemented and reviewed. Adding only an address is not sufficient to safely call a contract.

## Deploy with GitHub Pages
1. Upload `index.html`, `styles.css`, `app.js`, `config.js`, and `README.md` into the repository root on `main`.
2. In GitHub: **Settings → Pages → Deploy from a branch → `main` → `/ (root)**.
3. Wait for the Pages deployment to complete.
4. Open the published URL and test wallet connection with test ETH only.

## Safety
- Testnet only. Never test with a mainnet wallet holding meaningful funds.
- Never paste seed phrases or private keys into this site or GitHub.
- Public RPC endpoints may be rate-limited.
