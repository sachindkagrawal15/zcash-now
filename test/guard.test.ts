import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findSecrets, guarded, hasSeedPhrase } from '../src/guard.js';

// Synthetic values only: 'q' is a valid bech32 character, and the mnemonic is the
// public BIP-39 test vector, which no real wallet should use.
const FAKE_UFVK = `uviewtest1${'q'.repeat(60)}`;
const FAKE_SAPLING_KEY = `secret-extended-key-test1${'q'.repeat(60)}`;
const TEST_MNEMONIC = `${'abandon '.repeat(11)}about`;

test('finds a seed phrase anywhere in the arguments', () => {
  assert.deepEqual(findSecrets({ code: `const words = "${TEST_MNEMONIC}";` }), ['a seed phrase']);
});

test('finds viewing and spending keys by prefix, at any depth', () => {
  assert.deepEqual(findSecrets([FAKE_UFVK]), ['a unified full viewing key']);
  assert.deepEqual(findSecrets({ nested: { key: FAKE_SAPLING_KEY } }), ['a Sapling spending key']);
});

test('ignores addresses, txids, placeholders and prose', () => {
  const args = {
    address: `utest1${'q'.repeat(100)}`,
    txid: 'ab'.repeat(32),
    note: 'Put your uviewtest1… key in the server config, never in a chat.',
  };
  assert.deepEqual(findSecrets(args), []);
  assert.equal(hasSeedPhrase('The wallet sends the payment to the shop and waits for the block to be mined.'), false);
});

test('guarded refuses before the handler runs and never echoes the key', async () => {
  let ran = false;
  const tool = guarded(async (_args: { code: string }) => {
    ran = true;
    return { content: [] };
  });
  const result = await tool({ code: `const key = '${FAKE_UFVK}';` });
  assert.equal(result.isError, true);
  assert.equal(ran, false);
  assert.match(JSON.stringify(result), /unified full viewing key/);
  assert.doesNotMatch(JSON.stringify(result), new RegExp(FAKE_UFVK));
});
