---
id: get-test-coins-cli
title: Get testnet coins (TAZ) into a wallet
task: get-test-coins
stack: cli
tools: [zcash-devtool, Fauzec]
status: verified
checkedAt: 2026-11-04
evidence: Fauzec sent 1 TAZ to a zcash-devtool shielded-only unified address in transaction cc2d88b88890805b8a216b20adbbb492c3541271764526c234dfb40e607a8df4 (version 6, NU7), mined at testnet height 4,581,808 into the Ironwood pool. It was spendable after about 10 confirmations.
---
## Steps

```bash
# A receive address with shielded receivers only, so a faucet can't pay a transparent receiver.
zdt wallet -w ./w generate-address

# Claim at https://fauzec.com/ with that address and complete the human check (1 TAZ per address every 24 hours).
# At the Free Society Hack, you can also post the address in the mentors chat.

# Check that it arrived, then wait until it is spendable.
zdt wallet -w ./w sync
zdt wallet -w ./w list-tx
zdt wallet -w ./w balance
```

## Expected output

- `list-tx` shows the transaction as `Mined:` with `Output 0 (Ironwood)` and the value, received by your address. There is no sender address: shielded payments don't reveal one.
- `balance` shows the amount in `Balance:` straight away, and in `Ironwood Spendable:` after about 10 confirmations (about 4 minutes at 25-second blocks).
- `zcash_tx_status` on the transaction ID reports version 6 and consensus branch `77190ad9` (NU7).

## Gotchas

- Valar's faucet refused unified and Sapling addresses on 4 Nov 2026 ("the wallet cannot pay this address"), and the Jino Labs faucet is paused for NU7.
- Noir Wallet's testnet extension gives its own account a daily allowance, but it can't send on NU7 yet, so those coins can't be moved to another wallet.
- Testnet explorers can't show amounts or addresses, and testnet.zcashexplorer.app misreports the fee on Orchard-to-Ironwood transfers. Read amounts from the wallet.

## Privacy

- The faucet sees your IP address next to the address you claim with. Use a fresh address from `generate-address` for faucets, not one you publish elsewhere.
- TAZ has no value, but the address and its keys work the same way on mainnet. Keep the wallet folder and identity file private.
