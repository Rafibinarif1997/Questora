# RHOOD FORGE — Launchpad Core (Testnet workstream)

This branch adds the first Solidity core for RHOOD FORGE.

## Network
- Robinhood Chain Testnet
- Chain ID: 46630 (`0xb626`)
- RPC: `https://rpc.testnet.chain.robinhood.com` (public, rate-limited)
- Explorer: `https://explorer.testnet.chain.robinhood.com`
- Gas asset: ETH

Official network details: https://docs.robinhood.com/chain/connecting/

## Current contract scope
- `ForgeToken.sol`: minimal fixed-supply ERC-20.
- `RhoodFactory.sol`: permissionless launches with 500,000,000 tokens and the agreed 80/10/10 allocation.
- `BondingCurve.sol`: ETH/token constant-product virtual-reserve curve, 1% treasury fee, slippage bounds and reentrancy guard. New buys pause when the ETH graduation threshold is reached; sells remain enabled.

## Critical limitations — do not use with real funds
This is an unaudited development baseline, not production-ready software. Do not deploy to mainnet or promote it as secure.

1. The curve is a simple virtual-reserve constant-product model. Initial virtual ETH reserve is 100 ETH; price and graduation parameters require economic simulation and adversarial testing.
2. Reaching the threshold only sets `graduationReady` and pauses new buys. It does **not** migrate liquidity to Uniswap v4. Sells remain enabled. A reviewed migration adapter and verified Robinhood Chain v4 deployment addresses are required.
3. Team and airdrop allocations are transferred to the launch-time recipient addresses. They are not vested or claim-locked.
4. The fee is 1% and goes to the platform treasury. Creator fees are not implemented in this baseline.
5. No oracle, indexer, anti-bot system, metadata storage, launch moderation, or production frontend contract integration is included yet.
6. Independent audit, fuzz/invariant testing, economic simulations, testnet deployment verification and a documented incident plan are required before real-value use.

## Build
Install Foundry, then run:

```bash
forge build
forge test
```

Never store deployment private keys in the repository. Use environment variables and a dedicated test wallet. Verify `eth_chainId` equals `0xb626` before broadcasting.

## Testnet deployment preparation

Copy `.env.example` to `.env`, replace every placeholder with addresses you control, and fund a dedicated test wallet from the official testnet faucet. Then run:

```bash
forge build
forge test
source .env
forge script script/DeployRhoodFactory.s.sol:DeployRhoodFactory --rpc-url "$RH_RPC_URL" --broadcast
```

Do not use a wallet that holds valuable assets. Confirm chain ID 46630 and inspect the deployment transaction on the testnet explorer. The current script deploys only the factory; token launches are then created through `launchToken`.

## Uniswap v4 deployment note

Uniswap publishes Robinhood Chain **mainnet** v4 addresses (chain 4663), including PoolManager `0x8366a39cc670b4001a1121b8f6a443a643e40951` and PositionManager `0x58daec3116aae6d93017baaea7749052e8a04fa7`. These are mainnet addresses and must never be used on testnet. The official deployment list does not establish matching testnet addresses, so v4 graduation remains intentionally unimplemented until testnet contracts and the PositionManager interface are independently verified. See https://developers.uniswap.org/docs/protocols/v4/deployments.

## Next milestones
1. Unit, fuzz, invariant and economic tests.
2. Confirm Uniswap v4 deployment addresses and PositionManager compatibility on Robinhood Chain.
3. Implement and audit graduation liquidity migration and LP custody/locking.
4. Add trusted event indexing and Supabase schema/RLS.
5. Configure the deployed factory address in `assets/config.js`; the create form then calls `launchToken` on testnet. The trade terminal supports direct curve quotes, buys and sells when given the token/curve addresses.
6. Deploy the Supabase Edge Function `indexer`, set its secrets, and invoke it on a schedule. It indexes launch, buy, sell and graduation-threshold events; candle aggregation remains a follow-up.
7. Execute end-to-end testnet launch, buy, sell, graduation and failure-mode tests.


## Supabase indexer setup

Apply `supabase/schema.sql`, then deploy `supabase/functions/indexer`. Configure function secrets:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- `INDEXER_SECRET` (long random value sent as the `x-indexer-secret` header)
- `FACTORY_ADDRESS` (deployed testnet factory)
- `RH_RPC_URL` (optional; defaults to Robinhood's public testnet RPC)
- `START_BLOCK` (factory deployment block)
- `MAX_BLOCK_RANGE` (optional; defaults to 1500)

Invoke the function periodically from a trusted scheduler with a POST request and the secret header. Do not place the service-role key or indexer secret in browser code. The indexer currently stores launches/trades and graduation-ready status; it does not yet aggregate OHLC candles or provide a reorg/finality reconciliation process.
