# RHOOD Forge — VibeVibe-inspired launchpad UI

A responsive, dark, red-accented launchpad discovery interface designed from the provided screenshot.

## Files
- `index.html` — page structure
- `styles.css` — responsive dark UI, 3-column token cards, mobile layout
- `app.js` — sample market cards, search, category selectors, tabs, filters, grid/list switch, wallet connect/network switch, safe launch form
- `config.js` — Robinhood Chain Testnet and contract placeholders

## Important distinction
Market cards are **sample/demo data** to reproduce the reference layout. They are not real token listings, prices, market caps, volume or live bonding-curve progress. The UI does not submit transactions against unknown contracts.

## Required contracts before enabling on-chain features
1. Launchpad Factory: creates tokens, emits `TokenCreated`, enforces fixed supply.
2. Bonding-curve router: buy/sell, quotes, reserves, fees, slippage and deadlines.
3. Team vesting: 50M tokens, 6-month cliff and 12-month vesting.
4. Merkle airdrop: 50M token allocation and proof-based claims.
5. Graduation manager and verified Uniswap V4 deployments: threshold, pool initialization and liquidity migration.
6. Event indexer/API: token cards, market caps, recent launches, graduation state and progress. Static GitHub Pages cannot host a secure backend.

## Intended tokenomics
500,000,000 maximum supply; 80% (400M) bonding curve, 10% (50M) team vesting, 10% (50M) Merkle airdrop.

## Testnet configuration
Chain ID `46630` (`0xb626`), ETH gas. RPC and explorer are configured in `config.js`; verify current official endpoints before production use.

## Deploy
Upload these five files into the repository's `main` branch root. In GitHub choose **Settings → Pages → Deploy from a branch → main → /(root)**.

Never place private keys, seed phrases, or service-role keys in this public repository.
