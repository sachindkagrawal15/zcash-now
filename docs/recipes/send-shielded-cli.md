# Send a shielded payment from the command line

Recipe `send-shielded-cli` for the cli stack, verified on 2026-11-04. Evidence: zcash-devtool built from commit 0b3436b sent 0.1 TAZ from Ironwood to a Noir Wallet unified address with the memo "trial 1" in transaction c00460bfaef41be5147089572189c5548bf1fbc6454e1b532c09f9c717d06abe (version 6, NU7), mined at testnet height 4,581,860. The fee was 0.00025 TAZ.

## Before you start

- Rust 1.89 or later, and Git. The release build takes about 4 minutes.
- A few TAZ from Fauzec or a hack mentor. Valar's faucet refused shielded addresses on 4 Nov 2026.

## Steps

```bash
git clone https://github.com/zcash/zcash-devtool.git
cd zcash-devtool
cargo build --release
alias zdt="$PWD/target/release/zcash-devtool"

# New testnet wallet. The seed is encrypted to the age identity file, which is
# created if it does not exist. With no terminal on stdin, an empty line makes a new seed.
zdt wallet -w ./w init --name demo -i ./w-identity.txt -n test < /dev/null

# A receive address with shielded receivers only. Give this one to payers and faucets.
zdt wallet -w ./w generate-address

# After funding: sync, then check that the funds are spendable.
zdt wallet -w ./w sync
zdt wallet -w ./w balance

# Send 0.01 TAZ with a memo. --value is in zatoshis (1 TAZ = 100,000,000).
zdt wallet -w ./w send -i ./w-identity.txt --address <utest1...> --value 1000000 --memo "order 7f3a"
zdt wallet -w ./w list-tx
```

## Expected output

- `sync` logs `Scan complete for range ChainTip(...)`.
- `balance` prints `Height:` and spendable lines for Sapling, Orchard, Ironwood and Unshielded funds. New shielded funds land in Ironwood.
- `send` broadcasts the transaction. Check it with `zcash_tx_status`: seen, then mined, then confirmed.

## Gotchas

- The default server is zec.rocks, which is `testnet.zec.rocks:443` on testnet. `-s` picks another.
- The address `init` creates also has a transparent receiver. `generate-address` with no `--pool` flag leaves it out.
- `--pool orchard` on `generate-address` is still right for Ironwood: Ironwood notes use the Orchard receiver.
- Received funds need confirmations before they are spendable. Funds from another wallet took about 10 confirmations (4 minutes at 25-second blocks).
- `send` splits change into several notes (up to `--target-note-count`, default 4), so later sends don't wait for change to confirm.
- If `send` fails after `Sending transaction...` (for example `peer closed connection`), the signed transaction is already saved and its coins are locked. Don't send again: `list-tx` shows it as Unmined with an expiry height. Rebroadcast the saved bytes (`transactions.raw` in the wallet's `data.sqlite`) with lightwalletd's `SendTransaction` before that height, or wait for expiry to release the coins.

## Privacy

- Amounts, sender and receiver are shielded on-chain. The memo is readable by the recipient and anyone holding their viewing key, so put an order token in it, not personal data.
- The light-wallet server sees your IP address and when you sync. On a watched network, add `--connection tor` to `sync` and `send`.
- Keep `w-identity.txt` and the `w` folder out of git and out of every chat.
