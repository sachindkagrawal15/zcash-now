// ZIP 321 payment URIs for a single payment: https://zips.z.cash/zip-0321

const MAX_MEMO_BYTES = 512;
const MAX_ZEC = 21_000_000;
const AMOUNT = /^(\d+)(?:\.(\d{1,8}))?$/;
const BASE64URL = /^[A-Za-z0-9_-]*$/;
const SHIELDED = /^(?:u1|utest1|zs1|ztestsapling1)[02-9ac-hj-np-z]+$/;
const TRANSPARENT = /^(?:t1|t3|tm|t2)[1-9A-HJ-NP-Za-km-z]{33}$/;
const KNOWN_PARAMS = new Set(['address', 'amount', 'memo', 'label', 'message']);

export interface PaymentRequest {
  address: string;
  amount?: string;
  memo?: string;
  label?: string;
  message?: string;
}

export function isShieldedAddress(address: string): boolean {
  return SHIELDED.test(address);
}

export function isTransparentAddress(address: string): boolean {
  return TRANSPARENT.test(address);
}

export function buildPaymentUri(request: PaymentRequest): string {
  validateAddress(request.address);
  const params: string[] = [];
  if (request.amount !== undefined) params.push(`amount=${validateAmount(request.amount)}`);
  if (request.memo !== undefined) params.push(`memo=${encodeMemo(request.address, request.memo)}`);
  if (request.label !== undefined) params.push(`label=${encodeURIComponent(request.label)}`);
  if (request.message !== undefined) params.push(`message=${encodeURIComponent(request.message)}`);
  return `zcash:${request.address}${params.length ? `?${params.join('&')}` : ''}`;
}

export function parsePaymentUri(uri: string): PaymentRequest {
  if (!uri.startsWith('zcash:')) throw new Error('A payment URI starts with zcash:');
  const [path, query] = splitOnce(uri.slice('zcash:'.length), '?');
  const values = new Map<string, string>();
  if (path) values.set('address', path);
  for (const pair of query ? query.split('&') : []) {
    const [name, value] = splitOnce(pair, '=');
    if (/\.\d+$/.test(name)) throw new Error('Multi-payment URIs (address.1 and so on) are not supported here.');
    if (values.has(name)) throw new Error(`Parameter ${name} appears twice.`);
    if (name.startsWith('req-') && !KNOWN_PARAMS.has(name)) throw new Error(`Required parameter ${name} is not supported.`);
    if (KNOWN_PARAMS.has(name)) values.set(name, value);
  }
  const address = values.get('address');
  if (!address) throw new Error('The URI has no address.');
  validateAddress(address);
  const request: PaymentRequest = { address };
  const amount = values.get('amount');
  if (amount !== undefined) request.amount = validateAmount(amount);
  const memo = values.get('memo');
  if (memo !== undefined) request.memo = decodeMemo(address, memo);
  const label = values.get('label');
  if (label !== undefined) request.label = decodeURIComponent(label);
  const message = values.get('message');
  if (message !== undefined) request.message = decodeURIComponent(message);
  return request;
}

// Splits at the first separator only, so a value keeps any later '=' and can be rejected.
function splitOnce(text: string, separator: string): [string, string] {
  const index = text.indexOf(separator);
  return index < 0 ? [text, ''] : [text.slice(0, index), text.slice(index + 1)];
}

function validateAddress(address: string): void {
  if (!isShieldedAddress(address) && !isTransparentAddress(address)) {
    throw new Error('Not a unified, Sapling or transparent Zcash address.');
  }
}

function validateAmount(amount: string): string {
  const match = AMOUNT.exec(amount);
  if (!match) throw new Error('Amounts are decimal ZEC with at most 8 decimal places, for example 0.01.');
  if (Number(match[1]) > MAX_ZEC || (Number(match[1]) === MAX_ZEC && /[1-9]/.test(match[2] ?? ''))) {
    throw new Error('Amounts cannot exceed 21,000,000 ZEC.');
  }
  return amount;
}

function encodeMemo(address: string, memo: string): string {
  if (!isShieldedAddress(address)) throw new Error('Memos can only go to shielded addresses.');
  const bytes = Buffer.from(memo, 'utf8');
  if (bytes.length > MAX_MEMO_BYTES) throw new Error(`Memos hold at most ${MAX_MEMO_BYTES} bytes.`);
  return bytes.toString('base64url');
}

function decodeMemo(address: string, encoded: string): string {
  if (!isShieldedAddress(address)) throw new Error('Memos can only go to shielded addresses.');
  if (!BASE64URL.test(encoded)) throw new Error('Memos are base64url without padding.');
  const bytes = Buffer.from(encoded, 'base64url');
  if (bytes.length > MAX_MEMO_BYTES) throw new Error(`Memos hold at most ${MAX_MEMO_BYTES} bytes.`);
  return bytes.toString('utf8');
}
