// BNB HUNTER: authenticated, read-only BNB Chain NFT mint scanner.
// Deploy as Supabase Edge Function: scan-wallets
import { createClient } from "npm:@supabase/supabase-js@2";
import { id as eventId } from "npm:ethers@6";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CRON_SECRET = Deno.env.get("BNB_HUNTER_CRON_SECRET");
const BSC_RPC_URL = Deno.env.get("BSC_RPC_URL") || "https://bsc-dataseed.binance.org/";
const ERC721_TRANSFER = eventId("Transfer(address,address,uint256)").toLowerCase();
const ERC1155_SINGLE = eventId("TransferSingle(address,address,address,uint256,uint256)").toLowerCase();
const ERC1155_BATCH = eventId("TransferBatch(address,address,address,uint256[],uint256[])").toLowerCase();
const ZERO = "0x" + "0".repeat(64);
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function topicAddress(address: string) { return "0x" + address.toLowerCase().replace(/^0x/, "").padStart(64, "0"); }
function word(hex: string, byteOffset: number) {
  const start = 2 + byteOffset * 2;
  return BigInt("0x" + (hex.slice(start, start + 64) || "0"));
}
function decodeArray(data: string, offsetBytes: bigint): bigint[] {
  const offset = Number(offsetBytes);
  const len = Number(word(data, offset));
  if (!Number.isSafeInteger(len) || len < 0 || len > 1000) return [];
  const out: bigint[] = [];
  for (let i = 0; i < len; i++) out.push(word(data, offset + 32 + i * 32));
  return out;
}
async function rpc(method: string, params: unknown[]) {
  const response = await fetch(BSC_RPC_URL, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!response.ok) throw new Error(`BSC RPC HTTP ${response.status}`);
  const body = await response.json();
  if (body.error) throw new Error(body.error.message || "BSC RPC error");
  return body.result;
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST required" }), { status: 405, headers: { ...cors, "content-type": "application/json" } });
  try {
    if (!SUPABASE_URL) throw new Error("Missing Supabase environment variable: SUPABASE_URL");
    if (!SERVICE_ROLE_KEY) throw new Error("Missing Supabase environment variable: SUPABASE_SERVICE_ROLE_KEY");
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    console.log("scan-wallets: request accepted");
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return new Response(JSON.stringify({ error: "Sign in first" }), { status: 401, headers: { ...cors, "content-type": "application/json" } });
    // Supabase Cron calls this endpoint with the service-role JWT stored in Vault.
    // Browser calls continue to require a normal authenticated user session.
    const isScheduledCall = token === SERVICE_ROLE_KEY;
    let ownerIds: string[] = [];
    if (isScheduledCall) {
      const { data: enabledWallets, error: ownersError } = await admin.from("hunter_wallets").select("owner_id").eq("enabled", true);
      if (ownersError) throw ownersError;
      ownerIds = [...new Set((enabledWallets || []).map((row: { owner_id: string }) => row.owner_id))];
    } else {
      const { data: authData, error: authError } = await admin.auth.getUser(token);
      if (authError || !authData.user) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...cors, "content-type": "application/json" } });
      ownerIds = [authData.user.id];
    }
    let totalWallets = 0;
    let totalEvents = 0;
    let scannedOwners = 0;
    let firstFromBlock: number | null = null;
    let lastToBlock: number | null = null;
    for (const ownerId of ownerIds) {
      const { data: wallets, error: walletError } = await admin.from("hunter_wallets").select("id,address").eq("owner_id", ownerId).eq("enabled", true);
      if (walletError) throw walletError;
      if (!wallets?.length) continue;
  
      const latestBlockHex = await rpc("eth_blockNumber", []);
      const latestBlock = Number(BigInt(latestBlockHex));
      const { data: previous } = await admin.from("hunter_scan_runs").select("to_block").eq("owner_id", ownerId).eq("status", "success").order("started_at", { ascending: false }).limit(1).maybeSingle();
      // First scan checks the latest 1,000 blocks; subsequent scans continue from the last successful checkpoint.
      const fromBlock = previous?.to_block ? Number(previous.to_block) + 1 : Math.max(0, latestBlock - 999);
      const toBlock = Math.min(latestBlock, fromBlock + 999);
      const { data: run, error: runError } = await admin.from("hunter_scan_runs").insert({
        owner_id: ownerId, status: "running", wallets_checked: wallets.length, events_found: 0,
        from_block: fromBlock, to_block: toBlock,
      }).select("id").single();
      if (runError) throw runError;
  
      let found = 0;
      try {
        const recipientWallets = wallets.map(w => ({ ...w, address: w.address.toLowerCase() }));
        // Keep topic OR lists small and block ranges bounded for public RPC reliability.
        for (let wi = 0; wi < recipientWallets.length; wi += 40) {
          const group = recipientWallets.slice(wi, wi + 40);
          const topics = group.map(w => topicAddress(w.address));
          const walletByTopic = new Map(group.map(w => [topicAddress(w.address).toLowerCase(), w]));
          const queries = [
            { kind: "erc721_mint", topic: ERC721_TRANSFER, filter: [ERC721_TRANSFER, ZERO, topics] },
            { kind: "erc1155_single_mint", topic: ERC1155_SINGLE, filter: [ERC1155_SINGLE, null, ZERO, topics] },
            { kind: "erc1155_batch_mint", topic: ERC1155_BATCH, filter: [ERC1155_BATCH, null, ZERO, topics] },
          ];
          for (const q of queries) {
            const logs = await rpc("eth_getLogs", [{ fromBlock: "0x" + fromBlock.toString(16), toBlock: "0x" + toBlock.toString(16), topics: q.filter }]);
            const rows: Record<string, unknown>[] = [];
            for (const log of logs || []) {
              const recipientTopic = q.kind === "erc721_mint" ? log.topics?.[2] : log.topics?.[3];
              const wallet = walletByTopic.get(String(recipientTopic || "").toLowerCase());
              if (!wallet) continue;
              const base = {
                owner_id: ownerId, wallet_id: wallet.id, chain_id: 56,
                nft_contract: String(log.address).toLowerCase(), minter_address: wallet.address,
                tx_hash: String(log.transactionHash).toLowerCase(), block_number: Number(BigInt(log.blockNumber)),
                event_kind: q.kind,
              };
              if (q.kind === "erc721_mint") {
                rows.push({ ...base, token_id: BigInt(log.topics[3]).toString() });
              } else if (q.kind === "erc1155_single_mint") {
                rows.push({ ...base, token_id: word(log.data, 0).toString() });
              } else {
                const idsOffset = word(log.data, 0);
                for (const tokenId of decodeArray(log.data, idsOffset)) rows.push({ ...base, token_id: tokenId.toString() });
              }
            }
            for (let ri = 0; ri < rows.length; ri += 100) {
              const part = rows.slice(ri, ri + 100);
              const { error } = await admin.from("hunter_mint_events").upsert(part, { onConflict: "owner_id,tx_hash,nft_contract,token_id", ignoreDuplicates: true });
              if (error) throw error;
              found += part.length;
            }
          }
        }
        const { error: finishError } = await admin.from("hunter_scan_runs").update({
          status: "success", events_found: found, finished_at: new Date().toISOString(),
        }).eq("id", run.id);
        if (finishError) throw finishError;
      } catch (scanError) {
        await admin.from("hunter_scan_runs").update({
          status: "failed", events_found: found, error_message: String(scanError?.message || scanError).slice(0, 1000),
          finished_at: new Date().toISOString(),
        }).eq("id", run.id);
        throw scanError;
      }
  
      totalWallets += wallets.length;
      totalEvents += found;
      scannedOwners++;
      firstFromBlock = firstFromBlock === null ? fromBlock : Math.min(firstFromBlock, fromBlock);
      lastToBlock = lastToBlock === null ? toBlock : Math.max(lastToBlock, toBlock);
    }
    return new Response(JSON.stringify({
      message: isScheduledCall ? "Scheduled scan completed" : "Scan completed",
      owners_scanned: scannedOwners, wallets_checked: totalWallets, events_found: totalEvents,
      from_block: firstFromBlock, to_block: lastToBlock, scheduled: isScheduledCall
    }), { headers: { ...cors, "content-type": "application/json" } });
  } catch (error) {
    console.error("scan-wallets failed:", error?.stack || error?.message || String(error));
    return new Response(JSON.stringify({ error: error?.message || "Scanner failed" }), { status: 500, headers: { ...cors, "content-type": "application/json" } });
  }
});
