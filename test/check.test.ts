import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RULES, check } from '../src/rules.js';

const CASES: Array<[rule: string, code: string]> = [
  ['stale/dead-lightwalletd', "const server = 'https://lightwalletd.testnet.electriccoin.co:9067';"],
  ['stale/webzjs-on-nu7', "import { WebWallet } from '@chainsafe/webzjs-wallet';"],
  ['stale/v4-transaction', 'zcash-devtool wallet -w ./w send --tx-version v4 --address x --value 1'],
  ['stale/orchard-pool', "await fetch('/api/v1/faucet', { body: JSON.stringify({ pool: 'orchard' }) });"],
  ['stale/zecli-from-crates', 'cargo install zecli'],
  ['stale/75-second-blocks', 'const BLOCK_TIME_SECONDS = 75;'],
  ['stale/hard-coded-fee', 'const fee = 10000;'],
  ['privacy/spending-key-on-server', 'const seed = process.env.WALLET_SEED_PHRASE;'],
  ['privacy/transparent-funding', "await zcash.sendTransaction({ to, amount, fundingSource: 'transparent' });"],
  ['privacy/pii-in-memo', 'const memo = `order for ${customer.email}`;'],
  ['privacy/logged-key', 'console.log("watching with", ufvk);'],
  ['correctness/float-amounts', 'const zats = parseFloat(amount) * 1e8;'],
];

test('there is one case per rule', () => {
  assert.deepEqual(CASES.map(([rule]) => rule).sort(), RULES.map((rule) => rule.id).sort());
});

for (const [rule, code] of CASES) {
  test(`${rule} fires`, () => {
    const findings = check(code);
    assert.ok(
      findings.some((finding) => finding.rule === rule),
      `expected ${rule}, got ${findings.map((finding) => finding.rule).join(', ') || 'nothing'}`,
    );
  });
}

test('current code passes clean', () => {
  const code = [
    "const server = 'https://testnet.zec.rocks:443';",
    "await zcash.sendTransaction({ to, amount: '0.01', memo: orderToken, fundingSource: 'shielded' });",
    'zcash-devtool wallet -w ./w generate-address --pool orchard --pool sapling',
  ].join('\n');
  assert.deepEqual(check(code), []);
});

test('findings carry the line number and a source link', () => {
  const [finding] = check("const ok = 1;\nconst server = 'testnet.lightwalletd.com';");
  assert.equal(finding.line, 2);
  assert.match(finding.source ?? '', /^https:\/\//);
});
