---
id: payment-link-node
title: Build a ZIP 321 payment link
task: payment-link
stack: node
tools: [node]
status: partial
checkedAt: 2026-11-04
evidence: The builder below is the one in zcash-now's src/zip321.ts, and its unit tests check the ZIP 321 rules for amounts, memos, req- parameters and duplicates. No wallet has paid one of its links yet.
---
## The format

`zcash:<address>?amount=<ZEC>&memo=<base64url>&message=<percent-encoded text>`

- Amounts are decimal ZEC with 1 to 8 decimal places, for example `0.01`. No other separators.
- Memos are base64url (`-` and `_`) with no `=` padding, at most 512 bytes, and only for shielded addresses. A memo on a transparent address makes the whole link invalid.
- An unknown parameter starting with `req-` makes the link invalid. Other unknown parameters are ignored.

## Code

```js
const SHIELDED = /^(?:u1|utest1|zs1|ztestsapling1)[02-9ac-hj-np-z]+$/;

export function paymentLink({ address, amount, memo, message }) {
  const params = [];
  if (amount !== undefined) {
    if (!/^\d+(?:\.\d{1,8})?$/.test(amount)) throw new Error('amount: decimal ZEC, up to 8 decimals');
    params.push(`amount=${amount}`);
  }
  if (memo !== undefined) {
    if (!SHIELDED.test(address)) throw new Error('memos need a shielded address');
    const bytes = Buffer.from(memo, 'utf8');
    if (bytes.length > 512) throw new Error('memo: at most 512 bytes');
    params.push(`memo=${bytes.toString('base64url')}`);
  }
  if (message !== undefined) params.push(`message=${encodeURIComponent(message)}`);
  return `zcash:${address}${params.length ? `?${params.join('&')}` : ''}`;
}

// paymentLink({ address: 'utest1...', amount: '0.01', memo: 'order 7f3a' })
// -> zcash:utest1...?amount=0.01&memo=b3JkZXIgN2YzYQ
```

Show the link as a QR code (for example with the `qrcode` npm package) and as a button. Noir Wallet can pay the same request with `sendTransaction`; see the noir-connect-send recipe.

## Gotchas

- Keep amounts as strings. `0.29 * 1e8` in JavaScript is `28999999.999999996`.
- Give payers an address with shielded receivers only (zcash-devtool `generate-address`), so a wallet can't fall back to a transparent receiver.

## Privacy

- The link itself is not on-chain, but anyone who sees it learns the address, amount and memo. Send it over a private channel.
- Use a random order token as the memo, not the buyer's name or email.
