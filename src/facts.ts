import { readFileSync } from 'node:fs';
import { fromRoot } from './paths.js';

export type Network = 'main' | 'test';

export const TOPICS = [
  'upgrades',
  'pools',
  'addresses',
  'endpoints',
  'faucets',
  'explorers',
  'sdks',
  'fees',
  'payments',
] as const;

export type Topic = (typeof TOPICS)[number];

// works / broken / unverified describe a tool or service; info is a plain fact.
export type FactStatus = 'works' | 'broken' | 'unverified' | 'info';

// read: taken from a source page. probe: a live server call. run: a command we ran.
export type VerifiedBy = 'read' | 'probe' | 'run';

export interface Fact {
  id: string;
  topic: Topic;
  networks: Network[];
  claim: string;
  replaces?: string[];
  status?: FactStatus;
  source: string;
  verifiedAt: string;
  verifiedBy: VerifiedBy;
  lastFailure?: string;
}

export interface Endpoint {
  host: string;
  port: number;
}

export interface FactsFile {
  version: number;
  updatedAt: string;
  lightwalletd: Record<Network, Endpoint>;
  explorerTx: Partial<Record<Network, string>>;
  // A known mined transaction per network, used by the smoke test and the freshness job.
  referenceTx?: Partial<Record<Network, string>>;
  branchIds: Record<string, string>;
  facts: Fact[];
}

let cache: FactsFile | undefined;

export function factsPath(): string {
  return fromRoot('data', 'facts.json');
}

export function loadFacts(): FactsFile {
  cache ??= JSON.parse(readFileSync(factsPath(), 'utf8')) as FactsFile;
  return cache;
}

export function selectFacts(file: FactsFile, network: Network, topic?: Topic): Fact[] {
  return file.facts.filter((fact) => fact.networks.includes(network) && (!topic || fact.topic === topic));
}

export function upgradeForBranchId(file: FactsFile, branchId: string): string | undefined {
  return file.branchIds[branchId.toLowerCase().replace(/^0x/, '')];
}

export function explorerTxUrl(file: FactsFile, network: Network, txid: string): string | undefined {
  return file.explorerTx[network]?.replace('{txid}', txid);
}
