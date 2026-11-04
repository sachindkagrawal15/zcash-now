import type { CallToolResult } from '@modelcontextprotocol/server';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { errorResult } from './result.js';

const BIP39 = new Set(wordlist);
const SEED_MIN_WORDS = 12;
const BECH32_DATA = '[02-9ac-hj-np-z]{40,}';

const KEY_PATTERNS: Array<[label: string, pattern: RegExp]> = [
  ['a Sapling spending key', new RegExp(`secret-extended-key-(?:main|test)1${BECH32_DATA}`, 'i')],
  ['a unified full viewing key', new RegExp(`\\buview(?:test)?1${BECH32_DATA}`, 'i')],
  ['a unified incoming viewing key', new RegExp(`\\buivk(?:test)?1${BECH32_DATA}`, 'i')],
  ['a Sapling viewing key', new RegExp(`\\bzxview(?:s|testsapling)1${BECH32_DATA}`, 'i')],
  ['an age secret key', /AGE-SECRET-KEY-1[02-9AC-HJ-NP-Z]{40,}/],
];

export function hasSeedPhrase(text: string): boolean {
  let run = 0;
  for (const word of text.toLowerCase().split(/[^a-z]+/)) {
    if (!word) continue;
    run = BIP39.has(word) ? run + 1 : 0;
    if (run >= SEED_MIN_WORDS) return true;
  }
  return false;
}

export function findSecrets(value: unknown): string[] {
  const found = new Set<string>();
  visitStrings(value, (text) => {
    for (const [label, pattern] of KEY_PATTERNS) if (pattern.test(text)) found.add(label);
    if (hasSeedPhrase(text)) found.add('a seed phrase');
  });
  return [...found];
}

function visitStrings(value: unknown, onString: (text: string) => void): void {
  if (typeof value === 'string') onString(value);
  else if (Array.isArray(value)) value.forEach((item) => visitStrings(item, onString));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => visitStrings(item, onString));
}

export function refusal(secrets: string[]): CallToolResult {
  return errorResult(
    [
      `zcash-now refused this call: the input contains ${secrets.join(' and ')}.`,
      'Anything in an AI chat is visible to the model provider, so treat that key as exposed. If it holds funds, move them; on testnet, make a new wallet.',
      'Keep keys out of prompts: have the code read them from a file or environment variable at run time, and send zcash-now only addresses, transaction IDs and code without secrets.',
    ].join(' '),
  );
}

// Every tool runs behind this check, so a pasted key never reaches a handler or a reply.
export function guarded<A>(handler: (args: A) => Promise<CallToolResult>): (args: A) => Promise<CallToolResult> {
  return async (args) => {
    const secrets = findSecrets(args);
    return secrets.length > 0 ? refusal(secrets) : handler(args);
  };
}
