import type { CallToolResult } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { explorerTxUrl, loadFacts, upgradeForBranchId } from '../facts.js';
import { Lightwalletd, isNotFound, isOffline, type RawTransaction } from '../lightwalletd.js';
import { errorResult, jsonBlock, textResult } from '../result.js';
import { displayTxidToHash, readTxHeader } from '../txid.js';

// lightwalletd's sentinel height for a transaction mined on a fork, not the main chain.
const FORK_HEIGHT = 2n ** 64n - 1n;

export const txStatusInput = z.object({
  txid: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'A transaction ID is 64 hexadecimal characters.')
    .describe('Transaction ID as wallets and explorers display it.'),
  network: z.enum(['test', 'main']).default('test').describe('Which Zcash network the transaction is on.'),
});

type HashOrder = 'internal' | 'display';

export async function zcashTxStatus(args: z.infer<typeof txStatusInput>): Promise<CallToolResult> {
  if (isOffline()) return errorResult('Network calls are off (ZCASH_NOW_OFFLINE=1), so the transaction cannot be looked up.');
  const txid = args.txid.toLowerCase();
  const network = args.network === 'test' ? 'testnet' : 'mainnet';
  const lwd = new Lightwalletd(args.network);
  try {
    const found = await lookUp(lwd, txid);
    if (!found) {
      return textResult(
        `Not found: ${lwd.endpoint} has no ${network} transaction ${txid}. A payment broadcast seconds ago may not have reached this server yet; also check the network.`,
        jsonBlock({ state: 'not_found', txid, network: args.network, endpoint: lwd.endpoint }),
      );
    }

    const tip = BigInt((await lwd.getLatestBlock()).height);
    const height = BigInt(found.raw.height);
    const state = height === 0n ? 'mempool' : height === FORK_HEIGHT ? 'fork' : 'mined';
    const confirmations = state === 'mined' ? tip - height + 1n : 0n;
    const file = loadFacts();
    const header = readTxHeader(found.raw.data);
    const upgrade = header?.consensusBranchId ? upgradeForBranchId(file, header.consensusBranchId) : undefined;
    const explorer = explorerTxUrl(file, args.network, txid);

    const summary =
      state === 'mined'
        ? `mined at height ${height}, with ${confirmations} confirmations (tip ${tip}).`
        : state === 'mempool'
          ? 'seen in the mempool, not mined yet.'
          : 'mined on a fork that is not the main chain. Wait for it to be mined again.';
    const lines = [`Transaction ${txid} on ${network}: ${summary}`];
    if (header) {
      const branch = header.consensusBranchId ? `, consensus branch ${header.consensusBranchId}${upgrade ? ` (${upgrade})` : ''}` : '';
      lines.push(`Version ${header.version}${branch}, ${found.raw.data.length} bytes.`);
    }
    if (explorer) lines.push(`Explorer: ${explorer}`);

    return textResult(
      lines.join('\n'),
      jsonBlock({
        state,
        txid,
        network: args.network,
        height: state === 'mined' ? height.toString() : null,
        confirmations: confirmations.toString(),
        tip: tip.toString(),
        version: header?.version,
        consensusBranchId: header?.consensusBranchId,
        upgrade,
        sizeBytes: found.raw.data.length,
        explorer,
        hashOrder: found.order,
        endpoint: lwd.endpoint,
      }),
    );
  } catch (error) {
    return errorResult(`Lookup failed on ${lwd.endpoint}: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    lwd.close();
  }
}

// Try the internal byte order librustzcash wallets use, then the displayed order.
async function lookUp(lwd: Lightwalletd, txid: string): Promise<{ raw: RawTransaction; order: HashOrder } | undefined> {
  const attempts: Array<[HashOrder, Buffer]> = [
    ['internal', displayTxidToHash(txid)],
    ['display', Buffer.from(txid, 'hex')],
  ];
  for (const [order, hash] of attempts) {
    try {
      return { raw: await lwd.getTransaction(hash), order };
    } catch (error) {
      if (!isNotFound(error)) throw error;
    }
  }
  return undefined;
}
