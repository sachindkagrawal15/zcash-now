import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildPaymentUri, parsePaymentUri } from '../src/zip321.js';

const SHIELDED = `utest1${'qpzry9x8gf2tvdw0s3jn54khce6mua7l'.repeat(3)}`;
const TRANSPARENT = `tm${'A'.repeat(33)}`;

test('builds a link with amount, base64url memo and percent-encoded message', () => {
  const uri = buildPaymentUri({ address: SHIELDED, amount: '0.01', memo: 'order 7f3a', message: 'Coffee for two' });
  assert.equal(uri, `zcash:${SHIELDED}?amount=0.01&memo=b3JkZXIgN2YzYQ&message=Coffee%20for%20two`);
  assert.deepEqual(parsePaymentUri(uri), { address: SHIELDED, amount: '0.01', memo: 'order 7f3a', message: 'Coffee for two' });
});

test('amounts are decimal ZEC with 1 to 8 decimals, at most 21,000,000', () => {
  for (const amount of ['1', '0.01', '0.00000001', '21000000']) {
    assert.doesNotThrow(() => buildPaymentUri({ address: SHIELDED, amount }));
  }
  for (const amount of ['50.', '.5', '0.123456789', '1,5', '21000000.00000001']) {
    assert.throws(() => buildPaymentUri({ address: SHIELDED, amount }), amount);
  }
});

test('memos need a shielded address and fit in 512 bytes', () => {
  assert.throws(() => buildPaymentUri({ address: TRANSPARENT, memo: 'hi' }), /shielded/);
  assert.throws(() => parsePaymentUri(`zcash:${TRANSPARENT}?memo=aGk`), /shielded/);
  assert.throws(() => buildPaymentUri({ address: SHIELDED, memo: 'x'.repeat(513) }), /512/);
  assert.throws(() => parsePaymentUri(`zcash:${SHIELDED}?memo=b3JkZXIgN2YzYQ==`), /padding/);
});

test('rejects unknown req- parameters and duplicates, and ignores other unknowns', () => {
  assert.throws(() => parsePaymentUri(`zcash:${SHIELDED}?amount=1&req-color=red`), /req-color/);
  assert.throws(() => parsePaymentUri(`zcash:${SHIELDED}?amount=1&amount=2`), /twice/);
  assert.throws(() => parsePaymentUri(`zcash:${SHIELDED}?address=${SHIELDED}`), /twice/);
  assert.deepEqual(parsePaymentUri(`zcash:${SHIELDED}?amount=1&color=red`), { address: SHIELDED, amount: '1' });
});

test('says plainly that multi-payment links are not supported', () => {
  assert.throws(() => parsePaymentUri(`zcash:?address.1=${SHIELDED}&amount.1=1`), /Multi-payment/);
});
