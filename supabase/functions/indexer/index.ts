import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { createPublicClient, decodeEventLog, http, parseAbi } from "npm:viem@2.21.54";

const chainId = 46630;
const launchAbi = parseAbi([
  "event TokenLaunched(address indexed token,address indexed curve,address indexed creator,string name,string symbol,address teamRecipient,address airdropRecipient)"
]);
const curveAbi = parseAbi([
  "event Bought(address indexed buyer,uint256 ethIn,uint256 tokensOut,uint256 fee)",
  "event Sold(address indexed seller,uint256 tokensIn,uint256 ethOut,uint256 fee)",
  "event GraduationThresholdReached(uint256 ethReserve,uint256 blockNumber)"
]);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("POST required", { status: 405 });
  const secret = Deno.env.get("INDEXER_SECRET");
  if (!secret || req.headers.get("x-indexer-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const rpcUrl = Deno.env.get("RH_RPC_URL") ?? "https://rpc.testnet.chain.robinhood.com";
  const factoryAddress = Deno.env.get("FACTORY_ADDRESS") as `0x${string}` | undefined;
  const startBlock = BigInt(Deno.env.get("START_BLOCK") ?? "1");
  const maxRange = BigInt(Deno.env.get("MAX_BLOCK_RANGE") ?? "1500");
  if (!supabaseUrl || !serviceKey || !factoryAddress) {
    return new Response("Missing indexer environment configuration", { status: 500 });
  }

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const client = createPublicClient({ transport: http(rpcUrl, { timeout: 30_000 }) });
  const { data: cursorRow, error: cursorError } = await db
    .from("indexer_state").select("last_block").eq("key", "robinhood-testnet").maybeSingle();
  if (cursorError) return Response.json({ error: cursorError.message }, { status: 500 });

  const latest = await client.getBlockNumber();
  const fromBlock = cursorRow ? BigInt(cursorRow.last_block) + 1n : startBlock;
  if (fromBlock > latest) return Response.json({ ok: true, message: "Already caught up", latest: latest.toString() });

  const toBlock = fromBlock + maxRange - 1n > latest ? latest : fromBlock + maxRange - 1n;
  const blockTimes = new Map<string, string>();
  async function timestamp(blockNumber: bigint): Promise<string> {
    const key = blockNumber.toString();
    const cached = blockTimes.get(key);
    if (cached) return cached;
    const block = await client.getBlock({ blockNumber });
    const value = new Date(Number(block.timestamp) * 1000).toISOString();
    blockTimes.set(key, value);
    return value;
  }

  const launchLogs = await client.getLogs({
    address: factoryAddress,
    event: launchAbi[0],
    fromBlock,
    toBlock
  });
  let launchRows = 0;
  for (const log of launchLogs) {
    const decoded = decodeEventLog({ abi: launchAbi, data: log.data, topics: log.topics });
    const a = decoded.args;
    const blockTimestamp = await timestamp(log.blockNumber!);
    const row = {
      chain_id: chainId,
      token_address: a.token.toLowerCase(),
      curve_address: a.curve.toLowerCase(),
      creator_address: a.creator.toLowerCase(),
      team_recipient: a.teamRecipient.toLowerCase(),
      airdrop_recipient: a.airdropRecipient.toLowerCase(),
      token_name: a.name,
      token_symbol: a.symbol,
      total_supply: "500000000000000000000000000",
      curve_allocation: "400000000000000000000000000",
      team_allocation: "50000000000000000000000000",
      airdrop_allocation: "50000000000000000000000000",
      metadata_uri: null,
      launch_tx_hash: log.transactionHash!.toLowerCase(),
      launch_block: Number(log.blockNumber),
      status: "bonding",
      created_at: blockTimestamp,
      updated_at: blockTimestamp
    };
    const { error } = await db.from("launches").upsert(row, { onConflict: "chain_id,token_address" });
    if (error) throw new Error("Launch insert failed: " + error.message);
    launchRows++;
  }

  const { data: launches, error: launchesError } = await db
    .from("launches").select("token_address,curve_address").eq("chain_id", chainId);
  if (launchesError) throw new Error("Launch lookup failed: " + launchesError.message);

  let tradeRows = 0;
  let graduationEvents = 0;
  for (const launch of launches ?? []) {
    const curveAddress = launch.curve_address as `0x${string}`;
    const logs = await client.getLogs({ address: curveAddress, fromBlock, toBlock });
    const rows = [];
    for (const log of logs) {
      if (!log.topics[0]) continue;
      try {
        const decoded = decodeEventLog({ abi: curveAbi, data: log.data, topics: log.topics });
        const blockTimestamp = await timestamp(log.blockNumber!);
        if (decoded.eventName === "Bought") {
          const a = decoded.args;
          rows.push({
            chain_id: chainId, token_address: launch.token_address, curve_address: curveAddress.toLowerCase(),
            trader_address: a.buyer.toLowerCase(), side: "buy", eth_amount_wei: a.ethIn.toString(),
            token_amount_wei: a.tokensOut.toString(), fee_wei: a.fee.toString(),
            tx_hash: log.transactionHash!.toLowerCase(), log_index: log.logIndex,
            block_number: Number(log.blockNumber), block_timestamp: blockTimestamp
          });
        } else if (decoded.eventName === "Sold") {
          const a = decoded.args;
          rows.push({
            chain_id: chainId, token_address: launch.token_address, curve_address: curveAddress.toLowerCase(),
            trader_address: a.seller.toLowerCase(), side: "sell", eth_amount_wei: a.ethOut.toString(),
            token_amount_wei: a.tokensIn.toString(), fee_wei: a.fee.toString(),
            tx_hash: log.transactionHash!.toLowerCase(), log_index: log.logIndex,
            block_number: Number(log.blockNumber), block_timestamp: blockTimestamp
          });
        } else if (decoded.eventName === "GraduationThresholdReached") {
          const { error } = await db.from("launches").update({
            status: "graduation_ready", updated_at: blockTimestamp
          }).eq("chain_id", chainId).eq("token_address", launch.token_address);
          if (error) throw new Error("Graduation status update failed: " + error.message);
          graduationEvents++;
        }
      } catch (error) {
        if (String(error).includes("Decoded event signature")) continue;
        throw error;
      }
    }
    if (rows.length) {
      const { error } = await db.from("trade_events").upsert(rows, {
        onConflict: "chain_id,tx_hash,log_index", ignoreDuplicates: true
      });
      if (error) throw new Error("Trade insert failed: " + error.message);
      tradeRows += rows.length;
    }
  }

  const { error: stateError } = await db.from("indexer_state").upsert({
    key: "robinhood-testnet", last_block: Number(toBlock), updated_at: new Date().toISOString()
  });
  if (stateError) throw new Error("Indexer cursor update failed: " + stateError.message);

  return Response.json({
    ok: true, chainId, fromBlock: fromBlock.toString(), toBlock: toBlock.toString(),
    latest: latest.toString(), launches: launchRows, trades: tradeRows, graduationEvents
  });
});
