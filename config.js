/* RHOOD Forge configuration.
   Fill addresses only after the matching contracts are deployed and verified.
   Never put private keys or seed phrases in this file. */
window.RHOOD_CONFIG = {
  chainId: 46630,
  chainIdHex: "0xb626",
  chainName: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.testnet.chain.robinhood.com"],
  blockExplorerUrls: ["https://explorer.testnet.chain.robinhood.com"],
  contracts: {
    factory: "",
    bondingCurveRouter: "",
    graduationManager: "",
    merkleAirdrop: "",
    teamVesting: "",
    uniswapV4PoolManager: "",
    uniswapV4PositionManager: ""
  },
  /* Add verified ABI JSON and matching deployed address before enabling writes. */
  abis: {
    factory: null,
    bondingCurveRouter: null,
    graduationManager: null
  }
};