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

1. The curve is a simple virtual-reserve constant-product model. Initial virtual ETH reserve is 1 ETH; price and graduation parameters require economic simulation and adversarial testing.
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

## Next milestones
1. Unit, fuzz, invariant and economic tests.
2. Confirm Uniswap v4 deployment addresses and PositionManager compatibility on Robinhood Chain.
3. Implement and audit graduation liquidity migration and LP custody/locking.
4. Add trusted event indexing and Supabase schema/RLS.
5. Replace demo frontend data with indexed reads and verified wallet write actions.
6. Execute end-to-end testnet launch, buy, sell, graduation and failure-mode tests.
