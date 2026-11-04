---
id: watch-payments-cli
title: Watch for incoming payments with a viewing key
task: watch-payments
stack: cli
tools: [zcash-devtool, node]
status: partial
checkedAt: 2026-11-04
evidence: A view-only wallet was created with init-fvk from a testnet account's unified full viewing key, without printing the key, then synced; list-tx --mode csv printed its header. Detecting an actual payment has not run yet because no payment has been sent to it.
---
## Why a viewing key

A server holding the unified full viewing key (UFVK) can see payments to the account but cannot spend them. Keep the spending key, and the wallet that holds it, off the server.

## Steps

```bash
# On the machine that holds the spending key: the account's keys.
# list-accounts prints the UFVK. Copy it into the server's secret store, never into a chat.
zdt wallet -w ./w list-accounts

# On the server: a view-only wallet from that UFVK. --birthday is a block height
# before the first payment you expect; it defaults to the current height.
zdt wallet -w ./watch init-fvk --name shop --fvk "$ZCASH_UFVK"
zdt wallet -w ./watch sync

# One CSV row per output. The last column is the memo, which carries your order token.
zdt wallet -w ./watch list-tx --mode csv
```

## Matching orders by memo (Node)

```js
import { execFileSync } from 'node:child_process';

const zdt = (...args) => execFileSync('zcash-devtool', ['wallet', '-w', './watch', ...args], { encoding: 'utf8' });

export function paidOrderTokens() {
  zdt('sync');
  const [, ...rows] = zdt('list-tx', '--mode', 'csv').trim().split('\n');
  // The memo is the last column; order tokens contain no commas.
  return new Set(rows.map((row) => row.slice(row.lastIndexOf(',') + 1).trim()).filter(Boolean));
}
```

Run it after each block (about every 25 seconds on testnet). Mark an order paid when its token appears, and fulfil it after enough confirmations: `list-tx --json` gives each transaction's `mined_height`, and `zcash_tx_status` gives confirmations.

## Gotchas

- `sync` only sees mined transactions, so the first sighting is already "mined", not "seen".
- Use a fresh random token per order (for example 8 hex characters) so a memo can't be guessed or reused.
- `list-tx --json` emits only `txid` and `mined_height`. Use `--mode csv` for memos.

## Privacy

- The UFVK reveals every incoming and outgoing payment of that account to whoever holds it, so store it like a password.
- The light-wallet server sees the server's IP address and sync pattern. Run the watcher with `--connection tor` if that matters.
- Store order tokens, not names or emails, next to payments.
