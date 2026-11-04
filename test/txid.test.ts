import assert from 'node:assert/strict';
import { test } from 'node:test';
import { displayTxidToHash, readTxHeader } from '../src/txid.js';

test('the displayed txid is the hash reversed', () => {
  const hash = displayTxidToHash(`01${'00'.repeat(31)}`);
  assert.equal(hash.length, 32);
  assert.equal(hash[31], 1);
  assert.equal(hash[0], 0);
  assert.throws(() => displayTxidToHash('abc'), /64 hexadecimal/);
});

test('reads the version and consensus branch of a v6 transaction', () => {
  const raw = Buffer.alloc(20);
  raw.writeUInt32LE(0x80000006, 0);
  raw.writeUInt32LE(0x26a7270a, 4);
  raw.writeUInt32LE(0x77190ad9, 8);
  assert.deepEqual(readTxHeader(raw), {
    version: 6,
    overwintered: true,
    versionGroupId: '26a7270a',
    consensusBranchId: '77190ad9',
  });
});

test('v4 transactions carry no branch ID, and short input is rejected', () => {
  const raw = Buffer.alloc(20);
  raw.writeUInt32LE(0x80000004, 0);
  raw.writeUInt32LE(0x892f2085, 4);
  assert.equal(readTxHeader(raw)?.consensusBranchId, undefined);
  assert.equal(readTxHeader(Buffer.alloc(4)), undefined);
});
