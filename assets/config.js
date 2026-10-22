/* RHOOD FORGE frontend configuration.
   Demo mode is enabled until audited contracts, indexer/API and auth are configured.
   Never place private keys, OAuth secrets or Supabase service-role keys in this file. */
window.RHOOD_CONFIG = {
  brand: "RHOOD FORGE",
  network: { name: "Robinhood Chain Testnet", chainId: 46630, chainIdHex: "0xb626",
    rpc: "https://rpc.testnet.chain.robinhood.com",
    explorer: "https://explorer.testnet.chain.robinhood.com", currency: "ETH" },
  demoMode: true,
  authProvider: "privy",
  privyAppId: "",
  supabaseUrl: "",
  supabaseAnonKey: "",
  contracts: { factory: "", bondingCurve: "", router: "", feeRecipient: "" }
};
