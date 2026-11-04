const TXID = /^[0-9a-f]{64}$/i;

export function isTxid(value: string): boolean {
  return TXID.test(value);
}

// Wallets and explorers display a txid as the hash bytes reversed, while
// librustzcash wallets send lightwalletd the hash in its internal byte order.
export function displayTxidToHash(txid: string): Buffer {
  if (!isTxid(txid)) throw new Error('A txid is 64 hexadecimal characters.');
  return Buffer.from(txid, 'hex').reverse();
}

export interface TxHeader {
  version: number;
  overwintered: boolean;
  versionGroupId: string;
  consensusBranchId?: string;
}

// The first three fields of a serialized transaction. Only v5 (ZIP 225) and
// later carry the consensus branch ID, right after the version group ID.
export function readTxHeader(raw: Buffer): TxHeader | undefined {
  if (raw.length < 12) return undefined;
  const header = raw.readUInt32LE(0);
  const version = header & 0x7fffffff;
  return {
    version,
    overwintered: header >>> 31 === 1,
    versionGroupId: hex32(raw.readUInt32LE(4)),
    consensusBranchId: version >= 5 ? hex32(raw.readUInt32LE(8)) : undefined,
  };
}

function hex32(value: number): string {
  return value.toString(16).padStart(8, '0');
}
