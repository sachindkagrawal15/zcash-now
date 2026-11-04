import { loadFacts } from './facts.js';

export type Severity = 'error' | 'warning';

export interface Rule {
  id: string;
  severity: Severity;
  message: string;
  fix: string;
  fact: string;
  matches: (line: string) => boolean;
}

export interface Finding {
  rule: string;
  severity: Severity;
  line: number;
  excerpt: string;
  message: string;
  fix: string;
  source?: string;
}

const has =
  (pattern: RegExp) =>
  (line: string): boolean =>
    pattern.test(line);

const EMAIL = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i;
const PHONE = /\+?\b\d[\d -]{8,}\d\b/;
const PERSONAL_FIELD = /\b(?:email|phone|mobile|full_?name|customer_?name)\b/i;
const KEY_NAME = /\b(?:ufvk|uivk|viewing_?key|viewingKey|seed|mnemonic|spending_?key|spendingKey)\b/i;
const LOGGER = /(?:console\.(?:log|info|debug|warn|error)|logger\.\w+|log\.\w+|println!|print)\s*\(/;

// Pattern rules work on one line at a time, so they can miss things or fire
// on look-alikes. Each finding links the fact behind it so the agent can judge.
export const RULES: Rule[] = [
  {
    id: 'stale/dead-lightwalletd',
    severity: 'error',
    message: 'This light-wallet server is dead.',
    fix: 'Use testnet.zec.rocks:443 for testnet.',
    fact: 'endpoint.lightwalletd.dead',
    matches: has(/lightwalletd\.testnet\.electriccoin\.co|testnet\.lightwalletd\.com/i),
  },
  {
    id: 'stale/webzjs-on-nu7',
    severity: 'error',
    message: 'WebZjs is not on npm and has no Ironwood support, so it cannot pay on NU7 testnet.',
    fix: 'In a browser, connect Noir Wallet with @noir-wallet/sdk. On a server or the command line, use zcash-devtool.',
    fact: 'sdk.webzjs',
    matches: has(/@chainsafe\/webzjs-wallet/),
  },
  {
    id: 'stale/v4-transaction',
    severity: 'error',
    message: 'v4 transactions are invalid since NU7 on testnet.',
    fix: 'Let the wallet pick the transaction version.',
    fact: 'upgrade.nu7.testnet',
    matches: has(/TxVersion::V4\b|--tx-version[ =]v?4\b|\btx_?version\s*[:=]\s*['"]?v?4\b/i),
  },
  {
    id: 'stale/orchard-pool',
    severity: 'warning',
    message: 'Orchard accepts withdrawals only since NU6.3; new shielded funds go to Ironwood.',
    fix: "Ask for the ironwood pool (Thus Spoke Zakura: pool 'ironwood', ironwood_zatoshi). Unified addresses don't change: Ironwood uses their Orchard receiver.",
    fact: 'pool.orchard.sealed',
    matches: has(/\bpool\s*[:=]\s*['"]orchard['"]|\borchard_zatoshi\b|\buse (?:the )?orchard\b|fundingSource\s*:\s*['"]orchard['"]/i),
  },
  {
    id: 'stale/zecli-from-crates',
    severity: 'warning',
    message: 'zecli from crates.io makes Orchard-only addresses that cannot receive funds.',
    fix: 'Use zcash-devtool built from source.',
    fact: 'sdk.zecli',
    matches: has(/cargo install\b.*\bze?cli\b/),
  },
  {
    id: 'stale/75-second-blocks',
    severity: 'warning',
    message: 'NU7 cut the testnet block target from 75 to 25 seconds.',
    fix: 'Wait on confirmations rather than wall-clock time; 10 confirmations take about 4 minutes.',
    fact: 'upgrade.nu7.testnet',
    matches: (line) => /\b75\b/.test(line) && /block|confirm|spacing|interval/i.test(line),
  },
  {
    id: 'stale/hard-coded-fee',
    severity: 'warning',
    message: 'ZIP 317 sets fees per logical action, and Revision 2 cuts the marginal fee from 5,000 to 1,000 zatoshis.',
    fix: 'Let the wallet or SDK compute the fee.',
    fact: 'fee.zip317',
    matches: has(/\bfee\w*\s*[:=]\s*(?:10_?000|5_?000|1_?000|0\.0001|0\.00001)\b|--fee\b/i),
  },
  {
    id: 'privacy/spending-key-on-server',
    severity: 'error',
    message: 'This code handles a seed phrase or spending key.',
    fix: 'Give servers a viewing key (zcash-devtool init-fvk), and keep spending keys on the payer\'s device.',
    fact: 'payment.viewing-key-server',
    matches: has(/process\.env\.\w*(?:SEED|MNEMONIC|SPENDING|USK)\w*|secret-extended-key-(?:main|test)1|AGE-SECRET-KEY-1/i),
  },
  {
    id: 'privacy/transparent-funding',
    severity: 'warning',
    message: 'Transparent funds are public on-chain and can link the coins they spend.',
    fix: "Fund from shielded balances (fundingSource: 'shielded'), and shield transparent funds first.",
    fact: 'payment.shielded-funding',
    matches: has(/fundingSource\s*:\s*['"]transparent['"]|\b(?:tm|t1|t2|t3)[1-9A-HJ-NP-Za-km-z]{33}\b/),
  },
  {
    id: 'privacy/pii-in-memo',
    severity: 'warning',
    message: 'This memo may carry personal data, which stays readable to the recipient and anyone holding their viewing key.',
    fix: 'Put a random order token in the memo and keep personal data off-chain.',
    fact: 'payment.memo',
    matches: (line) => /memo/i.test(line) && (EMAIL.test(line) || PHONE.test(line) || PERSONAL_FIELD.test(line)),
  },
  {
    id: 'privacy/logged-key',
    severity: 'warning',
    message: 'A key or seed is passed to a logger, and logs leak.',
    fix: 'Log a fingerprint of the key, or nothing.',
    fact: 'payment.viewing-key-server',
    matches: (line) => LOGGER.test(line) && KEY_NAME.test(line),
  },
  {
    id: 'correctness/float-amounts',
    severity: 'warning',
    message: 'ZEC amounts in floating point lose precision: 0.29 * 1e8 is 28999999.999999996.',
    fix: 'Keep amounts as decimal strings, or as integer zatoshis with BigInt.',
    fact: 'payment.amounts',
    matches: (line) =>
      /\b(?:parseFloat|Number)\s*\([^)]*\b(?:amount|zec|taz)\b/i.test(line) ||
      (/\*\s*(?:1e8|100_?000_?000)\b/.test(line) && !/Math\.round|BigInt/.test(line)),
  },
];

export function check(code: string): Finding[] {
  const sources = new Map(loadFacts().facts.map((fact) => [fact.id, fact.source]));
  const findings: Finding[] = [];
  code.split(/\r?\n/).forEach((text, index) => {
    for (const rule of RULES) {
      if (!rule.matches(text)) continue;
      findings.push({
        rule: rule.id,
        severity: rule.severity,
        line: index + 1,
        excerpt: text.trim().slice(0, 160),
        message: rule.message,
        fix: rule.fix,
        source: sources.get(rule.fact),
      });
    }
  });
  return findings;
}
