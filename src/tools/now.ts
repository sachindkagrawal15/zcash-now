import type { CallToolResult } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { TOPICS, loadFacts, selectFacts, upgradeForBranchId, type Fact, type Network } from '../facts.js';
import { Lightwalletd, isOffline } from '../lightwalletd.js';
import { jsonBlock, textResult } from '../result.js';

export const nowInput = z.object({
  network: z.enum(['test', 'main']).default('test').describe('Which Zcash network the facts are for.'),
  topic: z.enum(TOPICS).optional().describe('Only return facts on this topic.'),
  live: z
    .boolean()
    .default(true)
    .describe('Also ask the light-wallet server for its current height and network upgrade.'),
});

export interface Probe {
  endpoint: string;
  chainName: string;
  blockHeight: string;
  consensusBranchId: string;
  upgrade?: string;
  server: string;
}

export async function probeLightwalletd(network: Network): Promise<Probe> {
  const lwd = new Lightwalletd(network);
  try {
    const info = await lwd.getLightdInfo();
    return {
      endpoint: lwd.endpoint,
      chainName: info.chainName,
      blockHeight: info.blockHeight,
      consensusBranchId: info.consensusBranchId,
      upgrade: upgradeForBranchId(loadFacts(), info.consensusBranchId),
      server: [info.vendor, info.version].filter(Boolean).join(' '),
    };
  } finally {
    lwd.close();
  }
}

export async function zcashNow(args: z.infer<typeof nowInput>): Promise<CallToolResult> {
  const facts = selectFacts(loadFacts(), args.network, args.topic);
  let probe: Probe | undefined;
  let probeError: string | undefined;
  if (args.live && !isOffline()) {
    try {
      probe = await probeLightwalletd(args.network);
    } catch (error) {
      probeError = error instanceof Error ? error.message : String(error);
    }
  }

  const name = args.network === 'test' ? 'testnet' : 'mainnet';
  const lines = [
    `Zcash ${name}: ${facts.length} facts${args.topic ? ` on ${args.topic}` : ''}. Trust these over what you remember; each names its source and when it was last checked.`,
  ];
  if (probe) {
    const upgrade = probe.upgrade ? ` (${probe.upgrade})` : '';
    lines.push(
      `Live: ${probe.endpoint} is at height ${probe.blockHeight} on consensus branch ${probe.consensusBranchId}${upgrade}, served by ${probe.server || 'an unnamed server'}.`,
    );
  } else if (probeError) {
    lines.push(`Live check failed: ${probeError}. The facts below are from their last recorded check.`);
  } else if (args.live) {
    lines.push('Live check skipped because ZCASH_NOW_OFFLINE=1.');
  }
  lines.push('', ...facts.map(formatFact));

  return textResult(lines.join('\n'), jsonBlock({ network: args.network, probe, probeError, facts }));
}

function formatFact(fact: Fact): string {
  const status = fact.status && fact.status !== 'info' ? `[${fact.status}] ` : '';
  const replaces = fact.replaces?.length ? ` Replaces: ${fact.replaces.join('; ')}.` : '';
  return `- ${status}${fact.claim}${replaces} (${fact.source}; ${fact.verifiedBy} ${fact.verifiedAt.slice(0, 10)})`;
}
