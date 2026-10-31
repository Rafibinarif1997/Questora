// BNB HUNTER: authenticated, read-only BNB Chain NFT mint scanner.
// Deploy as Supabase Edge Function: scan-wallets
import { createClient } from "npm:@supabase/supabase-js@2";
import { id as eventId } from "npm:ethers@6";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CRON_SECRET = Deno.env.get("BNB_HUNTER_CRON_SECRET");
const BSC_RPC_URL = Deno.env.get("BSC_RPC_URL") || "https://bsc-dataseed.binance.org/";

// Conservative defaults for the public BNB RPC. A failing log range is split automatically.
const WALLET_BATCH_SIZE = 10;
const BLOCK_BATCH_SIZE = 500;
const MIN_BLOCK_SPAN = 1;
const MAX_RPC_RETRIES = 3;

const ERC20_TRANSFER = eventId("Transfer(address,address,uint256)").toLowerCase();
const ERC721_TRANSFER = ERC20_TRANSFER;
const ERC1155_SINGLE = eventId("TransferSingle(address,address,address,uint256,uint256)").toLowerCase();
const ERC1155_BATCH = eventId("TransferBatch(address,address,address,uint256[],uint256[])").toLowerCase();
const ZERO = "0x" + "0".repeat(64);
const tokenMetaCache = new Map<string, { name: string | null; symbol: string | null; decimals: number | null }>();
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }
function topicAddress(address: string) {
  return "0x" + address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}
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
function errorText(value: unknown) {
  if (value instanceof Error) return value.message;
  return String(value);
}
function isRangeLimitError(message: string) {
  return /limit exceeded|too many results|query returned more than|block range|response size|result window|log response/i.test(message);
}
function isTemporaryRpcError(message: string) {
  return /429|rate.?limit|too many requests|temporar|timeout|timed out|503|502|504|ECONNRESET|fetch failed/i.test(message);
}
async function rpc(method: string, params: unknown[]) {
  let lastError = "Unknown RPC error";
  for (let attempt = 0; attempt <= MAX_RPC_RETRIES; attempt++) {
    try {
      const response = await fetch(BSC_RPC_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) throw new Error(`BSC RPC HTTP ${response.status}`);
      const body = await response.json();
      if (body.error) throw new Error(body.error.message || "BSC RPC error");
      return body.result;
    } catch (error) {
      lastError = errorText(error);
      if (!isTemporaryRpcError(lastError) || attempt === MAX_RPC_RETRIES) throw new Error(lastError);
      await sleep(500 * (attempt + 1));
    }
  }
  throw new Error(lastError);
}

async function readTokenMetadata(contract: string) {
  const key = contract.toLowerCase();
  const cached = tokenMetaCache.get(key);
  if (cached) return cached;
  const call = async (data: string) => {
    try {
      const result = await rpc("eth_call", [{ to: key, data }, "latest"]);
      if (!result || result === "0x") return null;
      const hex = String(result).slice(2);
      if (hex.length >= 128) {
        const offset = Number(BigInt("0x" + hex.slice(0, 64))) * 2;
        const length = Number(BigInt("0x" + hex.slice(offset, offset + 64)));
        if (length >= 0 && length <= 512) {
          const bytes = hex.slice(offset + 64, offset + 64 + length * 2);
          return new TextDecoder().decode(new Uint8Array((bytes.match(/.{2}/g) || []).map(x => parseInt(x, 16)))).replace(/\\0/g, "").trim();
        }
      }
      const bytes = hex.replace(/(00)+$/g, "");
      return new TextDecoder().decode(new Uint8Array((bytes.match(/.{2}/g) || []).map(x => parseInt(x, 16)))).replace(/\\0/g, "").trim() || null;
    } catch { return null; }
  };
  const [name, symbol, decimalsHex] = await Promise.all([
    call("0x06fdde03"), call("0x95d89b41"),
    rpc("eth_call", [{ to: key, data: "0x313ce567" }, "latest"]).catch(() => null),
  ]);
  let decimals: number | null = null;
  try { if (decimalsHex && decimalsHex !== "0x") decimals = Number(BigInt(decimalsHex)); } catch {}
  const value = { name, symbol, decimals };
  tokenMetaCache.set(key, value);
  return value;
}

// Split recipient topics first, then block windows, to fit strict BSC RPC limits.
async function getLogsAdaptive(
  filter: Record<string, unknown>,
  fromBlock: number,
  toBlock: number,
  recipientTopicIndex: number,
): Promise<any[]> {
  try {
    return await rpc("eth_getLogs", [{
      ...filter,
      fromBlock: "0x" + fromBlock.toString(16),
      toBlock: "0x" + toBlock.toString(16),
    }]) as any[];
  } catch (error) {
    const message = errorText(error);
    if (!isRangeLimitError(message)) throw error;

    const topics = filter.topics as unknown[];
    const recipients = topics?.[recipientTopicIndex];
    if (Array.isArray(recipients) && recipients.length > 1) {
      const mid = Math.ceil(recipients.length / 2);
      const makeFilter = (subset: unknown[]) => ({
        ...filter,
        topics: topics.map((item, index) => index === recipientTopicIndex ? subset : item),
      });
      const left = await getLogsAdaptive(makeFilter(recipients.slice(0, mid)), fromBlock, toBlock, recipientTopicIndex);
      await sleep(150);
      const right = await getLogsAdaptive(makeFilter(recipients.slice(mid)), fromBlock, toBlock, recipientTopicIndex);
      return left.concat(right);
    }

    if (fromBlock < toBlock) {
      const mid = Math.floor((fromBlock + toBlock) / 2);
      const left = await getLogsAdaptive(filter, fromBlock, mid, recipientTopicIndex);
      await sleep(150);
      const right = await getLogsAdaptive(filter, mid + 1, toBlock, recipientTopicIndex);
      return left.concat(right);
    }

    throw new Error(`BSC RPC limit exceeded for one recipient at block ${fromBlock}. Configure a higher-capacity BSC_RPC_URL provider.`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST required" }), {
      status: 405, headers: { ...cors, "content-type": "application/json" },
    });
  }

  try {
    if (!SUPABASE_URL) throw new Error("Missing Supabase environment variable: SUPABASE_URL");
    if (!SERVICE_ROLE_KEY) throw new Error("Missing Supabase environment variable: SUPABASE_SERVICE_ROLE_KEY");
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const cronHeader = req.headers.get("x-cron-secret") || "";
    const isScheduledCall = Boolean(CRON_SECRET && cronHeader && cronHeader === CRON_SECRET);
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");

    if (!isScheduledCall && !token) {
      return new Response(JSON.stringify({ error: "Sign in first" }), {
        status: 401, headers: { ...cors, "content-type": "application/json" },
      });
    }

    // Cron uses the dedicated x-cron-secret header; dashboard calls use the user's access token.
    let ownerIds: string[] = [];
    if (isScheduledCall) {
      const { data, error } = await admin.from("hunter_wallets").select("owner_id").eq("enabled", true);
      if (error) throw error;
      ownerIds = [...new Set((data || []).map((row: { owner_id: string }) => row.owner_id))];
    } else {
      const { data, error } = await admin.auth.getUser(token);
      if (error || !data.user) {
        return new Response(JSON.stringify({ error: "Invalid session" }), {
          status: 401, headers: { ...cors, "content-type": "application/json" },
        });
      }
      ownerIds = [data.user.id];
    }

    let totalWallets = 0;
    let totalEvents = 0;
    let scannedOwners = 0;
    let firstFromBlock: number | null = null;
    let lastToBlock: number | null = null;

    for (const ownerId of ownerIds) {
      const { data: wallets, error: walletError } = await admin
        .from("hunter_wallets").select("id,address").eq("owner_id", ownerId).eq("enabled", true);
      if (walletError) throw walletError;
      if (!wallets?.length) continue;

      const latestBlockHex = await rpc("eth_blockNumber", []);
      const latestBlock = Number(BigInt(latestBlockHex));
      const { data: previous, error: previousError } = await admin
        .from("hunter_scan_runs").select("to_block").eq("owner_id", ownerId)
        .eq("status", "success").order("started_at", { ascending: false }).limit(1).maybeSingle();
      if (previousError) throw previousError;

      // First scan starts at the latest 100 blocks. Later runs continue from the last successful checkpoint.
      const fromBlock = previous?.to_block !== null && previous?.to_block !== undefined
        ? Number(previous.to_block) + 1
        : Math.max(0, latestBlock - (BLOCK_BATCH_SIZE - 1));
      const toBlock = Math.min(latestBlock, fromBlock + BLOCK_BATCH_SIZE - 1);

      const { data: run, error: runError } = await admin.from("hunter_scan_runs").insert({
        owner_id: ownerId,
        status: "running",
        wallets_checked: wallets.length,
        events_found: 0,
        from_block: fromBlock,
        to_block: toBlock,
      }).select("id").single();
      if (runError) throw runError;

      let found = 0;
      try {
        const recipientWallets = wallets.map((w: { id: string; address: string }) => ({
          ...w, address: w.address.toLowerCase(),
        }));

        for (let wi = 0; wi < recipientWallets.length; wi += WALLET_BATCH_SIZE) {
          const group = recipientWallets.slice(wi, wi + WALLET_BATCH_SIZE);
          const topics = group.map((w: { address: string }) => topicAddress(w.address));
          const walletByTopic = new Map(group.map((w: { id: string; address: string }) => [
            topicAddress(w.address).toLowerCase(), w,
          ]));
          const queries = [
            { kind: "erc20_mint", filter: { topics: [ERC20_TRANSFER, ZERO, topics] } },
            { kind: "erc721_mint", filter: { topics: [ERC721_TRANSFER, ZERO, topics] } },
            { kind: "erc1155_single_mint", filter: { topics: [ERC1155_SINGLE, null, ZERO, topics] } },
            { kind: "erc1155_batch_mint", filter: { topics: [ERC1155_BATCH, null, ZERO, topics] } },
          ];

          for (const q of queries) {
            const recipientTopicIndex = (q.kind === "erc721_mint" || q.kind === "erc20_mint") ? 2 : 3;
            const logs = await getLogsAdaptive(q.filter, fromBlock, toBlock, recipientTopicIndex);
            const rows: Record<string, unknown>[] = [];
            for (const log of logs || []) {
              // ERC-20 and ERC-721 share Transfer topic; ERC-721 has indexed tokenId as topic[3].
              if (q.kind === "erc20_mint" && (log.topics?.length || 0) > 3) continue;
              if (q.kind === "erc721_mint" && (log.topics?.length || 0) < 4) continue;
              const recipientTopic = (q.kind === "erc721_mint" || q.kind === "erc20_mint") ? log.topics?.[2] : log.topics?.[3];
              const wallet = walletByTopic.get(String(recipientTopic || "").toLowerCase()) as
                | { id: string; address: string }
                | undefined;
              if (!wallet) continue;
              const contract = String(log.address).toLowerCase();
              const txHash = String(log.transactionHash).toLowerCase();
              const blockNumber = Number(BigInt(log.blockNumber));
              const meta = await readTokenMetadata(contract);
              const common = {
                owner_id: ownerId, wallet_id: wallet.id, chain_id: 56,
                contract_address: contract, wallet_address: wallet.address,
                token_name: meta.name, token_symbol: meta.symbol,
                tx_hash: txHash, block_number: blockNumber,
                project_name: meta.name || meta.symbol || null,
                contract_url: "https://bscscan.com/token/" + contract,
                transaction_url: "https://bscscan.com/tx/" + txHash,
              };
              if (q.kind === "erc20_mint") {
                const amount = word(log.data, 0).toString();
                const { error } = await admin.from("hunter_activity_events").upsert({
                  ...common, activity_type: "erc20_mint", token_id: "0",
                  amount, token_decimals: meta.decimals,
                }, { onConflict: "owner_id,tx_hash,contract_address,activity_type,token_id", ignoreDuplicates: true });
                if (error) throw error;
                found++;
              } else if (q.kind === "erc721_mint") {
                const tokenId = BigInt(log.topics[3]).toString();
                rows.push({
                  owner_id: ownerId, wallet_id: wallet.id, chain_id: 56,
                  nft_contract: contract, minter_address: wallet.address,
                  tx_hash: txHash, block_number: blockNumber, event_kind: q.kind, token_id: tokenId,
                });
                const { error } = await admin.from("hunter_activity_events").upsert({
                  ...common, activity_type: "erc721_mint", token_id: tokenId,
                }, { onConflict: "owner_id,tx_hash,contract_address,activity_type,token_id", ignoreDuplicates: true });
                if (error) throw error;
              } else if (q.kind === "erc1155_single_mint") {
                const tokenId = word(log.data, 0).toString();
                const amount = word(log.data, 32).toString();
                rows.push({
                  owner_id: ownerId, wallet_id: wallet.id, chain_id: 56,
                  nft_contract: contract, minter_address: wallet.address,
                  tx_hash: txHash, block_number: blockNumber, event_kind: q.kind, token_id: tokenId,
                });
                const { error } = await admin.from("hunter_activity_events").upsert({
                  ...common, activity_type: "erc1155_mint", token_id: tokenId, amount,
                }, { onConflict: "owner_id,tx_hash,contract_address,activity_type,token_id", ignoreDuplicates: true });
                if (error) throw error;
              } else {
                const ids = decodeArray(log.data, word(log.data, 0));
                const amounts = decodeArray(log.data, word(log.data, 32));
                for (let ti = 0; ti < ids.length; ti++) {
                  const tokenId = ids[ti].toString();
                  rows.push({
                    owner_id: ownerId, wallet_id: wallet.id, chain_id: 56,
                    nft_contract: contract, minter_address: wallet.address,
                    tx_hash: txHash, block_number: blockNumber, event_kind: q.kind, token_id: tokenId,
                  });
                  const { error } = await admin.from("hunter_activity_events").upsert({
                    ...common, activity_type: "erc1155_mint", token_id: tokenId,
                    amount: (amounts[ti] ?? 0n).toString(),
                  }, { onConflict: "owner_id,tx_hash,contract_address,activity_type,token_id", ignoreDuplicates: true });
                  if (error) throw error;
                }
              }
            }
            for (let ri = 0; ri < rows.length; ri += 100) {
              const { error } = await admin.from("hunter_mint_events")
                .upsert(rows.slice(ri, ri + 100), {
                  onConflict: "owner_id,tx_hash,nft_contract,token_id",
                  ignoreDuplicates: true,
                });
              if (error) throw error;
              found += Math.min(100, rows.length - ri);
            }
            // Gentle pacing for the public shared RPC endpoint.
            await sleep(120);
          }
        }

        const { error: finishError } = await admin.from("hunter_scan_runs").update({
          status: "success",
          events_found: found,
          finished_at: new Date().toISOString(),
        }).eq("id", run.id);
        if (finishError) throw finishError;
      } catch (scanError) {
        await admin.from("hunter_scan_runs").update({
          status: "failed",
          events_found: found,
          error_message: errorText(scanError).slice(0, 1000),
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
      owners_scanned: scannedOwners,
      wallets_checked: totalWallets,
      events_found: totalEvents,
      from_block: firstFromBlock,
      to_block: lastToBlock,
      scheduled: isScheduledCall,
      rpc_mode: "public-bsc-adaptive",
      wallet_batch_size: WALLET_BATCH_SIZE,
      block_batch_size: BLOCK_BATCH_SIZE,
    }), { headers: { ...cors, "content-type": "application/json" } });
  } catch (error) {
    console.error("scan-wallets failed:", errorText(error));
    return new Response(JSON.stringify({ error: errorText(error) }), {
      status: 500, headers: { ...cors, "content-type": "application/json" },
    });
  }
});
